
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.6.10 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.name = list[i].name;
    	child_ctx.inbetalat = list[i].inbetalat;
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.name = list[i].name;
    	return child_ctx;
    }

    // (97:1) {#each manniksor as {name}}
    function create_each_block_1(ctx) {
    	var p, t_value = ctx.name, t;

    	return {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr(p, "class", "svelte-2meer");
    			add_location(p, file, 97, 2, 1561);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.manniksor) && t_value !== (t_value = ctx.name)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (139:4) {#each manniksor as {name, inbetalat}
    function create_each_block(ctx) {
    	var tr, td0, t0, t1, t2, td1, t3_value = ctx.name, t3, t4, td2, t5_value = (ctx.totaltPrisStuga/ctx.antalMenniskor) - ctx.inbetalat, t5, t6, t7, td3, t8_value = ctx.inbetalat, t8, t9, t10;

    	return {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(ctx.i);
    			t1 = text(".");
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			td2 = element("td");
    			t5 = text(t5_value);
    			t6 = text("kr");
    			t7 = space();
    			td3 = element("td");
    			t8 = text(t8_value);
    			t9 = text("kr");
    			t10 = space();
    			attr(td0, "class", "svelte-2meer");
    			add_location(td0, file, 140, 6, 2380);
    			attr(td1, "class", "svelte-2meer");
    			add_location(td1, file, 141, 6, 2400);
    			attr(td2, "class", "svelte-2meer");
    			add_location(td2, file, 142, 6, 2422);
    			attr(td3, "class", "svelte-2meer");
    			add_location(td3, file, 143, 6, 2486);
    			add_location(tr, file, 139, 5, 2369);
    		},

    		m: function mount(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, t0);
    			append(td0, t1);
    			append(tr, t2);
    			append(tr, td1);
    			append(td1, t3);
    			append(tr, t4);
    			append(tr, td2);
    			append(td2, t5);
    			append(td2, t6);
    			append(tr, t7);
    			append(tr, td3);
    			append(td3, t8);
    			append(td3, t9);
    			append(tr, t10);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.manniksor) && t3_value !== (t3_value = ctx.name)) {
    				set_data(t3, t3_value);
    			}

    			if ((changed.totaltPrisStuga || changed.antalMenniskor || changed.manniksor) && t5_value !== (t5_value = (ctx.totaltPrisStuga/ctx.antalMenniskor) - ctx.inbetalat)) {
    				set_data(t5, t5_value);
    			}

    			if ((changed.manniksor) && t8_value !== (t8_value = ctx.inbetalat)) {
    				set_data(t8, t8_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(tr);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div0, h1, t1, div1, t2, div6, div2, p0, t3, t4, t5, t6, p1, t7, t8, t9, t10, div3, p2, t11, t12, t13, t14, p3, t15, t16, t17, t18, p4, t19, t20, t21, t22, div4, p5, t23, t24, t25, t26, p6, t27, t28, t29, t30, p7, t31, t32, t33, t34, div5, table, thead, tr0, th0, t36, tr1, th1, t37, th2, t39, th3, t41, th4, t43, tbody;

    	var each_value_1 = ctx.manniksor;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	var each_value = ctx.manniksor;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Sälen resan";
    			t1 = space();
    			div1 = element("div");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div6 = element("div");
    			div2 = element("div");
    			p0 = element("p");
    			t3 = text("Hur många är vi? ");
    			t4 = text(ctx.antalMenniskor);
    			t5 = text("kr");
    			t6 = space();
    			p1 = element("p");
    			t7 = text("Vad kommer det att kosta per person (cha)? ");
    			t8 = text(ctx.totalPerPerson);
    			t9 = text("kr");
    			t10 = space();
    			div3 = element("div");
    			p2 = element("p");
    			t11 = text("Vad kostar stugan? ");
    			t12 = text(ctx.totaltPrisStuga);
    			t13 = text("kr");
    			t14 = space();
    			p3 = element("p");
    			t15 = text("Försäkring? ");
    			t16 = text(ctx.forsakring);
    			t17 = text("kr");
    			t18 = space();
    			p4 = element("p");
    			t19 = text("Totalt: ");
    			t20 = text(ctx.totalt);
    			t21 = text("kr");
    			t22 = space();
    			div4 = element("div");
    			p5 = element("p");
    			t23 = text("Utrustning? ");
    			t24 = text(ctx.hyraUtrustning);
    			t25 = text("kr");
    			t26 = space();
    			p6 = element("p");
    			t27 = text("SkiPass? ");
    			t28 = text(ctx.skiPass);
    			t29 = text("kr");
    			t30 = space();
    			p7 = element("p");
    			t31 = text("Buss? ");
    			t32 = text(ctx.buss);
    			t33 = text("kr");
    			t34 = space();
    			div5 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Personer som ska med";
    			t36 = space();
    			tr1 = element("tr");
    			th1 = element("th");
    			t37 = space();
    			th2 = element("th");
    			th2.textContent = "Namn";
    			t39 = space();
    			th3 = element("th");
    			th3.textContent = "Ska betala";
    			t41 = space();
    			th4 = element("th");
    			th4.textContent = "Inbetalat";
    			t43 = space();
    			tbody = element("tbody");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(h1, file, 92, 1, 1483);
    			attr(div0, "class", "header svelte-2meer");
    			add_location(div0, file, 91, 0, 1461);
    			attr(div1, "class", "vem svelte-2meer");
    			add_location(div1, file, 95, 0, 1512);
    			add_location(p0, file, 103, 2, 1633);
    			add_location(p1, file, 104, 2, 1678);
    			attr(div2, "class", "totP svelte-2meer");
    			add_location(div2, file, 102, 1, 1612);
    			add_location(p2, file, 107, 2, 1779);
    			add_location(p3, file, 108, 2, 1827);
    			add_location(p4, file, 109, 2, 1863);
    			attr(div3, "class", "stugan svelte-2meer");
    			add_location(div3, file, 106, 1, 1756);
    			add_location(p5, file, 112, 2, 1921);
    			add_location(p6, file, 113, 2, 1961);
    			add_location(p7, file, 114, 2, 1991);
    			attr(div4, "class", "things svelte-2meer");
    			add_location(div4, file, 111, 1, 1898);
    			attr(th0, "colspan", "4");
    			attr(th0, "class", "svelte-2meer");
    			add_location(th0, file, 120, 5, 2075);
    			add_location(tr0, file, 119, 4, 2065);
    			attr(th1, "class", "svelte-2meer");
    			add_location(th1, file, 125, 5, 2168);
    			attr(th2, "class", "svelte-2meer");
    			add_location(th2, file, 126, 5, 2183);
    			attr(th3, "class", "svelte-2meer");
    			add_location(th3, file, 129, 5, 2215);
    			attr(th4, "class", "svelte-2meer");
    			add_location(th4, file, 132, 5, 2253);
    			attr(tr1, "class", "about");
    			add_location(tr1, file, 124, 4, 2144);
    			add_location(thead, file, 118, 3, 2053);
    			add_location(tbody, file, 137, 3, 2310);
    			attr(table, "class", "svelte-2meer");
    			add_location(table, file, 117, 2, 2042);
    			attr(div5, "class", "per svelte-2meer");
    			add_location(div5, file, 116, 1, 2022);
    			attr(div6, "class", "info svelte-2meer");
    			add_location(div6, file, 101, 0, 1592);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			append(div0, h1);
    			insert(target, t1, anchor);
    			insert(target, div1, anchor);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			insert(target, t2, anchor);
    			insert(target, div6, anchor);
    			append(div6, div2);
    			append(div2, p0);
    			append(p0, t3);
    			append(p0, t4);
    			append(p0, t5);
    			append(div2, t6);
    			append(div2, p1);
    			append(p1, t7);
    			append(p1, t8);
    			append(p1, t9);
    			append(div6, t10);
    			append(div6, div3);
    			append(div3, p2);
    			append(p2, t11);
    			append(p2, t12);
    			append(p2, t13);
    			append(div3, t14);
    			append(div3, p3);
    			append(p3, t15);
    			append(p3, t16);
    			append(p3, t17);
    			append(div3, t18);
    			append(div3, p4);
    			append(p4, t19);
    			append(p4, t20);
    			append(p4, t21);
    			append(div6, t22);
    			append(div6, div4);
    			append(div4, p5);
    			append(p5, t23);
    			append(p5, t24);
    			append(p5, t25);
    			append(div4, t26);
    			append(div4, p6);
    			append(p6, t27);
    			append(p6, t28);
    			append(p6, t29);
    			append(div4, t30);
    			append(div4, p7);
    			append(p7, t31);
    			append(p7, t32);
    			append(p7, t33);
    			append(div6, t34);
    			append(div6, div5);
    			append(div5, table);
    			append(table, thead);
    			append(thead, tr0);
    			append(tr0, th0);
    			append(thead, t36);
    			append(thead, tr1);
    			append(tr1, th1);
    			append(tr1, t37);
    			append(tr1, th2);
    			append(tr1, t39);
    			append(tr1, th3);
    			append(tr1, t41);
    			append(tr1, th4);
    			append(table, t43);
    			append(table, tbody);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.manniksor) {
    				each_value_1 = ctx.manniksor;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_1.length;
    			}

    			if (changed.antalMenniskor) {
    				set_data(t4, ctx.antalMenniskor);
    			}

    			if (changed.totalPerPerson) {
    				set_data(t8, ctx.totalPerPerson);
    			}

    			if (changed.totaltPrisStuga) {
    				set_data(t12, ctx.totaltPrisStuga);
    			}

    			if (changed.forsakring) {
    				set_data(t16, ctx.forsakring);
    			}

    			if (changed.totalt) {
    				set_data(t20, ctx.totalt);
    			}

    			if (changed.hyraUtrustning) {
    				set_data(t24, ctx.hyraUtrustning);
    			}

    			if (changed.skiPass) {
    				set_data(t28, ctx.skiPass);
    			}

    			if (changed.buss) {
    				set_data(t32, ctx.buss);
    			}

    			if (changed.manniksor || changed.totaltPrisStuga || changed.antalMenniskor) {
    				each_value = ctx.manniksor;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t1);
    				detach(div1);
    			}

    			destroy_each(each_blocks_1, detaching);

    			if (detaching) {
    				detach(t2);
    				detach(div6);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	var antalMenniskor; 
    	var totalPerPerson; 

    	//stugan
    	var totaltPrisStuga = 0;
    	var forsakring = 0;

    	//Övrigt 
    	var hyraUtrustning = 0;
    	var buss = 0;
    	var skiPass = 0;

    	var manniksor = [];
    	
    	

    	jQuery.ajax({
    		type: 'POST',
    		url: "/GetData",
    		contentType: "application/json",
    		data: JSON.stringify({}),
    		headers: {
    			Authorization: "..."
    		}
    	}).done((response) => {
    		console.log(response);

    		var info = response.info;
    		$$invalidate('manniksor', manniksor = response.people);

    		$$invalidate('totaltPrisStuga', totaltPrisStuga = info.totaltPrisStuga);
    		$$invalidate('forsakring', forsakring = info.forsakring);
    		$$invalidate('hyraUtrustning', hyraUtrustning = info.hyraUtrustning);
    		$$invalidate('buss', buss = info.buss);
    		$$invalidate('skiPass', skiPass = info.skiPass);

    	}).fail((data) => {
    		if(data.responseText != '') console.log("error:   " + data.responseText);
    		else console.log('error:   Oops! An error occured and your message could not be sent.');
    	});

    	let totalt;

    	$$self.$$.update = ($$dirty = { manniksor: 1, totaltPrisStuga: 1, forsakring: 1, totalt: 1, antalMenniskor: 1, hyraUtrustning: 1, buss: 1, skiPass: 1 }) => {
    		if ($$dirty.manniksor) { $$invalidate('antalMenniskor', antalMenniskor = manniksor.length); }
    		if ($$dirty.totaltPrisStuga || $$dirty.forsakring) { $$invalidate('totalt', totalt = totaltPrisStuga + forsakring); }
    		if ($$dirty.totalt || $$dirty.antalMenniskor || $$dirty.hyraUtrustning || $$dirty.buss || $$dirty.skiPass) { $$invalidate('totalPerPerson', totalPerPerson = (totalt/antalMenniskor) + hyraUtrustning + buss + skiPass); }
    	};

    	return {
    		antalMenniskor,
    		totalPerPerson,
    		totaltPrisStuga,
    		forsakring,
    		hyraUtrustning,
    		buss,
    		skiPass,
    		manniksor,
    		totalt
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map


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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
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
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
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

    /* src/App.svelte generated by Svelte v3.12.1 */

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
    	var p, t_value = ctx.name + "", t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-2meer");
    			add_location(p, file, 97, 2, 1561);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.manniksor) && t_value !== (t_value = ctx.name + "")) {
    				set_data_dev(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_1.name, type: "each", source: "(97:1) {#each manniksor as {name}}", ctx });
    	return block;
    }

    // (139:4) {#each manniksor as {name, inbetalat}
    function create_each_block(ctx) {
    	var tr, td0, t0, t1, t2, td1, t3_value = ctx.name + "", t3, t4, td2, t5_value = ((ctx.totaltPrisStuga+ctx.forsakring)/ctx.antalMenniskor) - ctx.inbetalat + "", t5, t6, t7, td3, t8_value = ctx.inbetalat + "", t8, t9, t10;

    	const block = {
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
    			attr_dev(td0, "class", "svelte-2meer");
    			add_location(td0, file, 140, 6, 2378);
    			attr_dev(td1, "class", "svelte-2meer");
    			add_location(td1, file, 141, 6, 2398);
    			attr_dev(td2, "class", "svelte-2meer");
    			add_location(td2, file, 142, 6, 2420);
    			attr_dev(td3, "class", "svelte-2meer");
    			add_location(td3, file, 143, 6, 2497);
    			add_location(tr, file, 139, 5, 2367);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(td0, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    			append_dev(tr, t4);
    			append_dev(tr, td2);
    			append_dev(td2, t5);
    			append_dev(td2, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(td3, t8);
    			append_dev(td3, t9);
    			append_dev(tr, t10);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.manniksor) && t3_value !== (t3_value = ctx.name + "")) {
    				set_data_dev(t3, t3_value);
    			}

    			if ((changed.totaltPrisStuga || changed.forsakring || changed.antalMenniskor || changed.manniksor) && t5_value !== (t5_value = ((ctx.totaltPrisStuga+ctx.forsakring)/ctx.antalMenniskor) - ctx.inbetalat + "")) {
    				set_data_dev(t5, t5_value);
    			}

    			if ((changed.manniksor) && t8_value !== (t8_value = ctx.inbetalat + "")) {
    				set_data_dev(t8, t8_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(tr);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(139:4) {#each manniksor as {name, inbetalat}", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var div0, h1, t1, div1, t2, div6, div2, p0, t3, t4, t5, p1, t6, t7, t8, t9, div3, p2, t10, t11, t12, t13, p3, t14, t15, t16, t17, p4, t18, t19, t20, t21, div4, p5, t22, t23, t24, t25, p6, t26, t27, t28, t29, p7, t30, t31, t32, t33, div5, table, thead, tr0, th0, t35, tr1, th1, t36, th2, t38, th3, t40, th4, t42, tbody;

    	let each_value_1 = ctx.manniksor;

    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = ctx.manniksor;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Sälen resan";
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div6 = element("div");
    			div2 = element("div");
    			p0 = element("p");
    			t3 = text("Hur många är vi? ");
    			t4 = text(ctx.antalMenniskor);
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Vad kommer det att kosta per person (cha)? ");
    			t7 = text(ctx.totalPerPerson);
    			t8 = text("kr");
    			t9 = space();
    			div3 = element("div");
    			p2 = element("p");
    			t10 = text("Vad kostar stugan? ");
    			t11 = text(ctx.totaltPrisStuga);
    			t12 = text("kr");
    			t13 = space();
    			p3 = element("p");
    			t14 = text("Försäkring? ");
    			t15 = text(ctx.forsakring);
    			t16 = text("kr");
    			t17 = space();
    			p4 = element("p");
    			t18 = text("Totalt: ");
    			t19 = text(ctx.totalt);
    			t20 = text("kr");
    			t21 = space();
    			div4 = element("div");
    			p5 = element("p");
    			t22 = text("Utrustning? ");
    			t23 = text(ctx.hyraUtrustning);
    			t24 = text("kr");
    			t25 = space();
    			p6 = element("p");
    			t26 = text("SkiPass? ");
    			t27 = text(ctx.skiPass);
    			t28 = text("kr");
    			t29 = space();
    			p7 = element("p");
    			t30 = text("Buss? ");
    			t31 = text(ctx.buss);
    			t32 = text("kr");
    			t33 = space();
    			div5 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Personer som ska med";
    			t35 = space();
    			tr1 = element("tr");
    			th1 = element("th");
    			t36 = space();
    			th2 = element("th");
    			th2.textContent = "Namn";
    			t38 = space();
    			th3 = element("th");
    			th3.textContent = "Ska betala";
    			t40 = space();
    			th4 = element("th");
    			th4.textContent = "Inbetalat";
    			t42 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(h1, file, 92, 1, 1483);
    			attr_dev(div0, "class", "header svelte-2meer");
    			add_location(div0, file, 91, 0, 1461);
    			attr_dev(div1, "class", "vem svelte-2meer");
    			add_location(div1, file, 95, 0, 1512);
    			add_location(p0, file, 103, 2, 1633);
    			add_location(p1, file, 104, 2, 1676);
    			attr_dev(div2, "class", "totP svelte-2meer");
    			add_location(div2, file, 102, 1, 1612);
    			add_location(p2, file, 107, 2, 1777);
    			add_location(p3, file, 108, 2, 1825);
    			add_location(p4, file, 109, 2, 1861);
    			attr_dev(div3, "class", "stugan svelte-2meer");
    			add_location(div3, file, 106, 1, 1754);
    			add_location(p5, file, 112, 2, 1919);
    			add_location(p6, file, 113, 2, 1959);
    			add_location(p7, file, 114, 2, 1989);
    			attr_dev(div4, "class", "things svelte-2meer");
    			add_location(div4, file, 111, 1, 1896);
    			attr_dev(th0, "colspan", "4");
    			attr_dev(th0, "class", "svelte-2meer");
    			add_location(th0, file, 120, 5, 2073);
    			add_location(tr0, file, 119, 4, 2063);
    			attr_dev(th1, "class", "svelte-2meer");
    			add_location(th1, file, 125, 5, 2166);
    			attr_dev(th2, "class", "svelte-2meer");
    			add_location(th2, file, 126, 5, 2181);
    			attr_dev(th3, "class", "svelte-2meer");
    			add_location(th3, file, 129, 5, 2213);
    			attr_dev(th4, "class", "svelte-2meer");
    			add_location(th4, file, 132, 5, 2251);
    			attr_dev(tr1, "class", "about");
    			add_location(tr1, file, 124, 4, 2142);
    			add_location(thead, file, 118, 3, 2051);
    			add_location(tbody, file, 137, 3, 2308);
    			attr_dev(table, "class", "svelte-2meer");
    			add_location(table, file, 117, 2, 2040);
    			attr_dev(div5, "class", "per svelte-2meer");
    			add_location(div5, file, 116, 1, 2020);
    			attr_dev(div6, "class", "info svelte-2meer");
    			add_location(div6, file, 101, 0, 1592);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div2);
    			append_dev(div2, p0);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(div6, t9);
    			append_dev(div6, div3);
    			append_dev(div3, p2);
    			append_dev(p2, t10);
    			append_dev(p2, t11);
    			append_dev(p2, t12);
    			append_dev(div3, t13);
    			append_dev(div3, p3);
    			append_dev(p3, t14);
    			append_dev(p3, t15);
    			append_dev(p3, t16);
    			append_dev(div3, t17);
    			append_dev(div3, p4);
    			append_dev(p4, t18);
    			append_dev(p4, t19);
    			append_dev(p4, t20);
    			append_dev(div6, t21);
    			append_dev(div6, div4);
    			append_dev(div4, p5);
    			append_dev(p5, t22);
    			append_dev(p5, t23);
    			append_dev(p5, t24);
    			append_dev(div4, t25);
    			append_dev(div4, p6);
    			append_dev(p6, t26);
    			append_dev(p6, t27);
    			append_dev(p6, t28);
    			append_dev(div4, t29);
    			append_dev(div4, p7);
    			append_dev(p7, t30);
    			append_dev(p7, t31);
    			append_dev(p7, t32);
    			append_dev(div6, t33);
    			append_dev(div6, div5);
    			append_dev(div5, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(thead, t35);
    			append_dev(thead, tr1);
    			append_dev(tr1, th1);
    			append_dev(tr1, t36);
    			append_dev(tr1, th2);
    			append_dev(tr1, t38);
    			append_dev(tr1, th3);
    			append_dev(tr1, t40);
    			append_dev(tr1, th4);
    			append_dev(table, t42);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.manniksor) {
    				each_value_1 = ctx.manniksor;

    				let i;
    				for (i = 0; i < each_value_1.length; i += 1) {
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
    				set_data_dev(t4, ctx.antalMenniskor);
    			}

    			if (changed.totalPerPerson) {
    				set_data_dev(t7, ctx.totalPerPerson);
    			}

    			if (changed.totaltPrisStuga) {
    				set_data_dev(t11, ctx.totaltPrisStuga);
    			}

    			if (changed.forsakring) {
    				set_data_dev(t15, ctx.forsakring);
    			}

    			if (changed.totalt) {
    				set_data_dev(t19, ctx.totalt);
    			}

    			if (changed.hyraUtrustning) {
    				set_data_dev(t23, ctx.hyraUtrustning);
    			}

    			if (changed.skiPass) {
    				set_data_dev(t27, ctx.skiPass);
    			}

    			if (changed.buss) {
    				set_data_dev(t31, ctx.buss);
    			}

    			if (changed.manniksor || changed.totaltPrisStuga || changed.forsakring || changed.antalMenniskor) {
    				each_value = ctx.manniksor;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
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
    				detach_dev(div0);
    				detach_dev(t1);
    				detach_dev(div1);
    			}

    			destroy_each(each_blocks_1, detaching);

    			if (detaching) {
    				detach_dev(t2);
    				detach_dev(div6);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    var forstaHalvan = 0;

    var totaltBetalat = 0;

    function instance($$self, $$props, $$invalidate) {
    	var antalMenniskor; 
    	var totalPerPerson; 
    	var perPerson;

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

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('antalMenniskor' in $$props) $$invalidate('antalMenniskor', antalMenniskor = $$props.antalMenniskor);
    		if ('totalPerPerson' in $$props) $$invalidate('totalPerPerson', totalPerPerson = $$props.totalPerPerson);
    		if ('perPerson' in $$props) perPerson = $$props.perPerson;
    		if ('totaltPrisStuga' in $$props) $$invalidate('totaltPrisStuga', totaltPrisStuga = $$props.totaltPrisStuga);
    		if ('forsakring' in $$props) $$invalidate('forsakring', forsakring = $$props.forsakring);
    		if ('forstaHalvan' in $$props) forstaHalvan = $$props.forstaHalvan;
    		if ('hyraUtrustning' in $$props) $$invalidate('hyraUtrustning', hyraUtrustning = $$props.hyraUtrustning);
    		if ('buss' in $$props) $$invalidate('buss', buss = $$props.buss);
    		if ('skiPass' in $$props) $$invalidate('skiPass', skiPass = $$props.skiPass);
    		if ('manniksor' in $$props) $$invalidate('manniksor', manniksor = $$props.manniksor);
    		if ('totaltBetalat' in $$props) totaltBetalat = $$props.totaltBetalat;
    		if ('totalt' in $$props) $$invalidate('totalt', totalt = $$props.totalt);
    	};

    	let totalt;

    	$$self.$$.update = ($$dirty = { manniksor: 1, totaltPrisStuga: 1, forsakring: 1, totalt: 1, antalMenniskor: 1, hyraUtrustning: 1, buss: 1, skiPass: 1 }) => {
    		if ($$dirty.manniksor) { $$invalidate('antalMenniskor', antalMenniskor = manniksor.length); }
    		if ($$dirty.totaltPrisStuga || $$dirty.forsakring) { $$invalidate('totalt', totalt = totaltPrisStuga + forsakring); }
    		if ($$dirty.totalt || $$dirty.antalMenniskor || $$dirty.hyraUtrustning || $$dirty.buss || $$dirty.skiPass) { $$invalidate('totalPerPerson', totalPerPerson = (totalt/antalMenniskor) + hyraUtrustning + buss + skiPass); }
    	};

    	perPerson = 0;

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
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment.name });
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

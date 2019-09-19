<script>

	var antalMenniskor; 
	var totalPerPerson; 
	var perPerson;

	$: antalMenniskor = manniksor.length;
	$: totalPerPerson = (totalt/antalMenniskor) + hyraUtrustning + buss + skiPass;

	//stugan
	var totaltPrisStuga = 0;
	var forsakring = 0;
	$: totalt = totaltPrisStuga + forsakring

	var forstaHalvan = 0;
	$: perPerson = 0;

	//Övrigt 
	var hyraUtrustning = 0;
	var buss = 0;
	var skiPass = 0;

	var manniksor = [];
	var totaltBetalat = 0;
	
	

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
		manniksor = response.people;

		totaltPrisStuga = info.totaltPrisStuga;
		forsakring = info.forsakring;
		hyraUtrustning = info.hyraUtrustning;
		buss = info.buss;
		skiPass = info.skiPass;

	}).fail((data) => {
		if(data.responseText != '') console.log("error:   " + data.responseText);
		else console.log('error:   Oops! An error occured and your message could not be sent.');
	}); 

</script>

<style>

	.header {
		border-bottom: solid 1px black;
		text-align: center;
	}

	div {
		padding: 10px;
		margin-bottom: 10px;
	}

	.vem {
		text-align: center;
	}

	.vem p {
		display: inline-block;
		margin: 10px;
	}

	.info div {
		border: double 3px black;
	}

	table {
		width: 100%;
	}

	table, td, th {
		border-collapse: collapse;
		border: solid 1px;
	}

</style>


<div class="header">
	<h1>Sälen resan</h1>
</div>

<div class="vem">
	{#each manniksor as {name}}
		<p>{name}</p>
	{/each}
</div>

<div class="info">
	<div class="totP">
		<p>Hur många är vi? {antalMenniskor}</p>
		<p>Vad kommer det att kosta per person (cha)? {totalPerPerson}kr</p>
	</div>
	<div class="stugan">
		<p>Vad kostar stugan? {totaltPrisStuga}kr</p>
		<p>Försäkring? {forsakring}kr</p>
		<p>Totalt: {totalt}kr</p>
	</div>
	<div class="things">
		<p>Utrustning? {hyraUtrustning}kr</p>
		<p>SkiPass? {skiPass}kr</p>
		<p>Buss? {buss}kr</p>
	</div>
	<div class="per">
		<table>
			<thead>
				<tr>
					<th colspan="4">
						Personer som ska med
					</th>
				</tr>
				<tr class="about">
					<th></th>
					<th>
						Namn
					</th>
					<th>
						Ska betala
					</th>
					<th>
						Inbetalat
					</th>
				</tr>
			</thead>
			<tbody>
				{#each manniksor as {name, inbetalat}, i}
					<tr>
						<td>{i}.</td>
						<td>{name}</td>
						<td>{((totaltPrisStuga+forsakring)/antalMenniskor) - inbetalat}kr</td>
						<td>{inbetalat}kr</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
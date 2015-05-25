

test( "shortest path test for schema graph for 'wkd' dataset", function() {

	var documentNode = {id:"Document0",label:"Document",nodeType:"Document"};
	var personNode   = {id:"Person0",  label:"Person",  nodeType:"Person"};
	var courtNode    = {id:"Court0",   label:"Court",   nodeType:"Court"};


	var g0 = new Eg("#g0",{
		title:"shortest path test - wkd dataset"
	});

	g0.addNodes(documentNode,personNode,courtNode);

	g0.addLink({source:documentNode,target:personNode,linkType:"creator"});
	g0.addLink({source:documentNode,target:courtNode,linkType:"fromCourt"});

	var helper = new EgHelper();

	equal( helper.shortestPathInNumberOfEdges(g0, "Court0", "DoesNOTExist" ) , undefined , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g0, "Document0", "Person" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g0, "Document0", "Court" ) , 1 , "Wrongly calulated path" );
    equal( helper.shortestPathInNumberOfEdges(g0, "Document0", "Document" ) , 0 , "Wrongly calulated path" );

    equal( helper.shortestPathInNumberOfEdges(g0, "Person0", "Person" ) , 0 , "Wrongly calulated path" );
    equal( helper.shortestPathInNumberOfEdges(g0, "Person0", "Document" ) , 1 , "Wrongly calulated path" );
    equal( helper.shortestPathInNumberOfEdges(g0, "Person0", "Court" ) , 2 , "Wrongly calulated path" );

    equal( helper.shortestPathInNumberOfEdges(g0, "Court0", "Court" ) , 0 , "Wrongly calulated path" );
    equal( helper.shortestPathInNumberOfEdges(g0, "Court0", "Document" ) , 1 , "Wrongly calulated path" );
    equal( helper.shortestPathInNumberOfEdges(g0, "Court0", "Person" ) , 2 , "Wrongly calulated path" );


});

test( "shortest path test for schema graph for 'acii' dataset", function() {

	var articleNode   = {id:"Article0",   label:"Article0",    nodeType:"Article"};
	var companyNode   = {id:"Company0",   label:"Company0",    nodeType:"Company"};
	var investmentNode= {id:"Investment0",label:"Investment0", nodeType:"Investment"};
	var investorNode  = {id:"Investor0",  label:"Investor0",   nodeType:"Investor"};


	var g1 = new Eg("#g1",{
		title:"shortest path test - acii dataset"
	});

	g1.addNodes(articleNode,companyNode,investmentNode,investorNode);

	g1.addLink({source:articleNode,target:companyNode,linkType:"mention"});
	g1.addLink({source:companyNode,target:investmentNode,linkType:"hasInvestment"});
	g1.addLink({source:investmentNode,target:investorNode,linkType:"hasInvestor"});


	var helper = new EgHelper();

	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "DoesNOTExist" ) , undefined , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "Article" ) , 0 , "Wrongly calulated path" );
 	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "Company" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "Investment" ) , 2 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "Investor" ) , 3 , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g1, "Company0", "Company" ) , 0 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Company0", "Article" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Company0", "Investment" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Company0", "Investor" ) , 2 , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g1, "Investment0", "Investment" ) , 0 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Investment0", "Investor" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Investment0", "Company" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Investment0", "Article" ) , 2 , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g1, "Investor0", "Investor" ) , 0 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Investor0", "Investment" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Investor0", "Company" ) , 2 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Investor0", "Article" ) , 3 , "Wrongly calulated path" );
});


test( "shortest path test for schema graph for 'okk' dataset", function() {

	var utenzaElettricaNode   = {id:"UtenzaElettrica0",   label:"UtenzaElettrica0",    nodeType:"UtenzaElettrica"};
	var comuneNode   = {id:"Comune0",   label:"Comune0",    nodeType:"Comune"};
	var indirizzoNode   = {id:"Indirizzo0",   label:"Indirizzo0",    nodeType:"Indirizzo"};
	var provinciaNode   = {id:"Provincia0",   label:"Provincia0",    nodeType:"Provincia"};
	var personaFisicaNode   = {id:"PersonaFisica0",   label:"PersonaFisica0",    nodeType:"PersonaFisica"};
	var organizationNode   = {id:"Organization0",   label:"Organization0",    nodeType:"Organization"};
	var fabbricatoNode   = {id:"Fabbricato0",   label:"Fabbricato0",    nodeType:"Fabbricato"};
	var titolaritaFabbricatNode   = {id:"TitolaritaFabbricat0",   label:"TitolaritaFabbricat0",    nodeType:"TitolaritaFabbricat"};

	var g2 = new Eg("#g2",{
		title:"shortest path test - okk dataset"
	});

	g2.addNodes(utenzaElettricaNode,comuneNode,indirizzoNode,
		provinciaNode,personaFisicaNode,organizationNode,
		fabbricatoNode,titolaritaFabbricatNode);

	g2.addLink({source:utenzaElettricaNode,target:organizationNode,linkType:"link"});
	g2.addLink({source:utenzaElettricaNode,target:indirizzoNode,linkType:"link"});
	g2.addLink({source:utenzaElettricaNode,target:personaFisicaNode,linkType:"link"});

	g2.addLink({source:personaFisicaNode,target:comuneNode,linkType:"link"});
	g2.addLink({source:personaFisicaNode,target:indirizzoNode, linkType:"link"});

	g2.addLink({source:organizationNode,target:personaFisicaNode ,linkType:"link"});
	g2.addLink({source:organizationNode,target:comuneNode ,linkType:"link"});
	g2.addLink({source:organizationNode,target:indirizzoNode ,linkType:"link"});

	g2.addLink({source:fabbricatoNode,target:indirizzoNode ,linkType:"link"});

	g2.addLink({source:titolaritaFabbricatNode,target:fabbricatoNode ,linkType:"link"});
	g2.addLink({source:titolaritaFabbricatNode,target:organizationNode ,linkType:"link"});
	g2.addLink({source:titolaritaFabbricatNode,target:personaFisicaNode ,linkType:"link"});

	g2.addLink({source:comuneNode,target:provinciaNode ,linkType:"link"});

	var helper = new EgHelper();

	equal( helper.shortestPathInNumberOfEdges(g2, "UtenzaElettrica0", "DoesNOTExist" ) , undefined , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g2, "UtenzaElettrica0", "UtenzaElettrica" ) , 0 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g2, "UtenzaElettrica0", "PersonaFisica" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g2, "UtenzaElettrica0", "Organization" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g2, "UtenzaElettrica0", "Fabbricato" ) , 2 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g2, "UtenzaElettrica0", "TitolaritaFabbricat" ) , 2 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g2, "UtenzaElettrica0", "Comune" ) , 2 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g2, "UtenzaElettrica0", "Indirizzo" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g2, "UtenzaElettrica0", "Provincia" ) , 3 , "Wrongly calulated path" );
});



test( "shortest path test for data graph for 'acii' dataset", function() {

	var articleNode   = {id:"Article0",   label:"Article0",    nodeType:"Article"};
	var companyNode   = {id:"Company0",   label:"Company0",    nodeType:"Company"};

	var articleNode1   = {id:"Article1",   label:"Article1",    nodeType:"Article"};
	var companyNode1   = {id:"Company1",   label:"Company1",    nodeType:"Company"};


	var investmentNode= {id:"Investment0",label:"Investment0", nodeType:"Investment"};
	var investorNode  = {id:"Investor0",  label:"Investor0",   nodeType:"Investor"};


	var g1 = new Eg("#g1b",{
		title:"shortest path test - acii dataset (data graph)",
		groupingForce:{
     	   Article:{x:-5,y:0},
           Investor:{x:+5,y:0}
    	}
    });

	g1.addNodes(articleNode, articleNode1, companyNode, companyNode1, investmentNode, investorNode);

	g1.addLink({source:articleNode,target:companyNode,linkType:"mention"});
	g1.addLink({source:articleNode1,target:companyNode1,linkType:"mention"});

	g1.addLink({source:companyNode,target:investmentNode,linkType:"hasInvestment"});
	g1.addLink({source:companyNode1,target:investmentNode,linkType:"hasInvestment"});

	g1.addLink({source:investmentNode,target:investorNode,linkType:"hasInvestor"});


	var helper = new EgHelper();

	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "DoesNOTExist" ) , undefined , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "Article" ) , 0 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Article1", "Article" ) , 0 , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "Company" ) , 1 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Article1", "Company" ) , 1 , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "Investment" ) , 2 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Article1", "Investment" ) , 2 , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g1, "Article0", "Investor" ) , 3 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Article1", "Investor" ) , 3 , "Wrongly calulated path" );

	equal( helper.shortestPathInNumberOfEdges(g1, "Investor0", "Article" ) , 3 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Investor0", "Company" ) , 2 , "Wrongly calulated path" );
	equal( helper.shortestPathInNumberOfEdges(g1, "Investor0", "Investment" ) , 1 , "Wrongly calulated path" );

});

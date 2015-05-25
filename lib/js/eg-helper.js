// helper library to compute usefull things from a graph
//
// The graph itself has to implement
//
// interface graph{
//     Node   getNode(id)
//     Node[] getNodes()
//     Link[] getLinks()
// }
//
// Where node is defined like:
//
// var node = {
//  id:id,
//  nodeType:nodeType
// }
//
// Where link is defined like:
//
// var link = {
//    source:Node,
//    target:Node
// }


function EgHelper(){}

EgHelper.prototype = (function(){

  function _distanceBetweenNodes(a,b){
    // in our case all distances are the same = 1
    return 1;
  }

  function _getFirstNodeWithType(g,type){
    var nodes = g.getNodes();
    for(var i=0;i<nodes.length;i++){
      if(nodes[i].nodeType === type){
        return nodes[i];
      }
    }
  }

  function _takeAllTypesFromGraph(g){
    var types =[];
    var nodes = g.getNodes();
    for(var i=0;i<nodes.length;i++){
      if( types.indexOf( nodes[i].nodeType) == -1){
        types.push(nodes[i].nodeType);
      }
    }
    return types;
  }

  function _getConnectedNodes(g,n){
    var allLinks = g.getLinks();
    var connectedNodes = [];
    for(var i=0;i<allLinks.length;i++){
      var link = allLinks[i];
      // we are traversing the graph according to direction
      // so take only links where our node is a source
      if(link.source.id == n.id){
        connectedNodes.push( link.target );
      }
      if(link.target.id == n.id){
        connectedNodes.push( link.source );
      }
    }
    return connectedNodes;
  }

  // Public methods
  return {
    // find shortest paths ( in number of edges )
    // from node of given id to all other nodes types
    // return minimum number of edges or null if path does not exist
    // It is a slightly modified version of Dijkstra's algorithm
    // from:
        //
    //  Dijkstra(G,w,s):
    //     dla każdego wierzchołka v w V[G] wykonaj
    //        d[v] := nieskończoność
    //        poprzednik[v] := niezdefiniowane
    //     d[s] := 0
    //     Q := V
    //     dopóki Q niepuste wykonaj
    //        u := Zdejmij_Min(Q)
    //        dla każdego wierzchołka v – sąsiada u wykonaj
    //           jeżeli d[v] > d[u] + w(u, v) to
    //              d[v] := d[u] + w(u, v)
    //              poprzednik[v] := u
    //              Dodaj(Q, v)

    allShortesPathsInNumberOfEdges : function(g, fromNode ){

      var typeDist = {}; //**

      var dist = {};
      var previous = {};
      var queue = [];
      var nodes = g.getNodes();
      for(var i=0;i<nodes.length;i++){
        var n = nodes[i];
        queue.push(n);

        typeDist[n.nodeType] = "Infinity"; //**

        dist[n.id] = "Infinity";
        previous[n.id] = undefined;
      }

      dist[fromNode.id] = 0;
      typeDist[fromNode.nodeType] = 0;

      while(queue.length != 0){
        // as all distances are equal take the first one
        // normally u = node with smallest distance from dist **
        var u = queue.shift();

        var neighbors = _getConnectedNodes.call(this,g,u);
        for(var j=0;j<neighbors.length;j++){
          var v = neighbors[j];
          var alt = dist[u.id] + _distanceBetweenNodes.call(this,u,v);
          if(alt < dist[v.id]){
            dist[v.id] = alt;

            // here add distance to typeDist but only if it either **
            if(typeDist[v.nodeType] == "Infinity"){
              typeDist[v.nodeType] = alt;
            }else{
              if(alt < typeDist[v.nodeType]){
                typeDist[v.nodeType] = alt;
              }
            }

            previous[v.id] = u;
            queue.push(v);
          }
        }

      }

      //return dist;
      return typeDist; // here instead of returning dist return typeDist  **
    },


    // find shortest paths ( in number of edges )
    // from a given node, to node of given type
    // return minimum number of edges or null if path does not exist
    shortestPathInNumberOfEdges : function(g, fromNodeOrfromNodeId, toNodeType ){
      // in case user passed nodeId
      var fromNode = null;
      if(typeof fromNodeOrfromNodeId == "string"){
        fromNode = g.getNode(fromNodeOrfromNodeId);
      }else{
        fromNode = fromNodeOrfromNodeId;
      }

      if( fromNode.nodeType == toNodeType ){
        return 0;
      }
      return this.allShortesPathsInNumberOfEdges(g, fromNode)[toNodeType];
    },

    // check that the node has proper connection to all types
    // according to schemaGraph
    // Node is "properly connected" if it is connected to node with another type
    // in the same way as in schema graph
    toHowManyTypesIsThisNodeProperlyConnected:function(schemaGraph,dataGraph,dataFromNode){

      var isProperlyConnectedTo = 0;

      var schemaFromNode = _getFirstNodeWithType.call(this,schemaGraph,dataFromNode.nodeType);

      var schemaSPs = this.allShortesPathsInNumberOfEdges(schemaGraph, schemaFromNode);

      var typesToCheck = _takeAllTypesFromGraph.call(this,schemaGraph);

      for(var i=0;i<typesToCheck.length;i++){
        var toNodeType = typesToCheck[i];

        var sp = this.shortestPathInNumberOfEdges(dataGraph, dataFromNode, toNodeType);

        if( schemaSPs[toNodeType] == sp ){
          isProperlyConnectedTo++;
        }
      }
      return isProperlyConnectedTo;
    },

    // takes as a parameter  connectionGraph, nodeTypeFrom, nodeTypeTo
    // in other words this function alone can be used to check that the filter is or is not strict
    // isThisNodeTypeReachableFrom(g, ff, filterClass);
    isThisNodeTypeReachableFrom : function(g, nodeTypeFrom, nodeTypeTo){
      // iterate the links
      if(nodeTypeFrom == nodeTypeTo){
        return true;
      }
      var allLinks = g.getLinks();
      for(var i=0;i<allLinks.length;i++){
        var link = allLinks[i];
        if( ( link.source.nodeType == nodeTypeFrom && link.target.nodeType == nodeTypeTo ) ||
            link.source.nodeType == nodeTypeTo && link.target.nodeType == nodeTypeFrom ){
          return true;
        }
      }
      return false;
    }

  };
})();

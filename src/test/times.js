const $rdf = require('rdflib');
const SOLID = $rdf.Namespace( "http://www.w3.org/ns/solid/terms#");
const TERMS = $rdf.Namespace('http://purl.org/dc/terms/');
const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
const BEERCOUNTER = $rdf.Namespace("https://ozcanseker.inrupt.net/vocabulary#");
const PIM = $rdf.Namespace("http://www.w3.org/ns/pim/space#");

function dateToString(date){
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    var yyyy = date.getFullYear();

    return dd + '/' + mm + '/' + yyyy;
}

function stringToDate(dateString){
    let array = dateString.split('/');
    let date = new Date(Date.UTC(array[2], array[1] - 1, array[0]));
    return date;
}

async function addExampleNodes(appStore, applocation){
    applocation = $rdf.sym(applocation);
    let bnode = $rdf.blankNode();
    // let bnode1 = $rdf.blankNode();
    // let bnode2 = $rdf.blankNode();
    // let bnode3 = $rdf.blankNode();

    appStore.add(applocation, TERMS('references'), bnode);
    // appStore.add(applocation, TERMS('references'), bnode1);
    // appStore.add(applocation, TERMS('references'), bnode2);
    // appStore.add(applocation, TERMS('references'), bnode3);

    appStore.add(bnode, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
    appStore.add(bnode, RDF('value'), 4);        
    appStore.add(bnode, TERMS('created'), stringToDate("17/09/2019"));  

    // appStore.add(bnode1, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
    // appStore.add(bnode1, RDF('value'), 5);        
    // appStore.add(bnode1, TERMS('created'), stringToDate("16/09/2019"));  
    
    // appStore.add(bnode2, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
    // appStore.add(bnode2, RDF('value'), 16);        
    // appStore.add(bnode2, TERMS('created'), stringToDate("15/09/2019"));  

    // appStore.add(bnode3, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
    // appStore.add(bnode3, RDF('value'), 2);
    // appStore.add(bnode3, TERMS('created'), stringToDate("14/09/2019"));  

    // let query = appStore.each(undefined, undefined, BEERCOUNTER('BeerCounterRecord'));
    // let query2 = appStore.each(query[0], undefined);

    let newAppFile = await $rdf.serialize(undefined, appStore,'text/turtle');
    return newAppFile;
}

let date = "17/09/2019";

let store = $rdf.graph();
addExampleNodes(store, "https://ozcan.seker.com");

let blankNode = store.any(null, null, stringToDate(date));
let statment = store.any(blankNode, RDF('value'), null);        

store.statements.map(statement => console.log(statement.object.value));
console.log(statment);

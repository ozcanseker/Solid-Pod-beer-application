const fileClient = require('solid-file-client');
const $rdf = require('rdflib');

const SOLID = $rdf.Namespace( "http://www.w3.org/ns/solid/terms#");
const TERMS = $rdf.Namespace('http://purl.org/dc/terms/');
const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
const BEERCOUNTER = $rdf.Namespace("https://ozcanseker.inrupt.net/vocabulary#");

class SolidCommuncator{
    constructor(webid, applocation, appStore, beerCounter){
        this.webid = webid;
        this.applocation = applocation;
        this.appStore = appStore;
        this.beerCounter = beerCounter;
        this.beerCounter.subscribe(this);
        this.queryList = [];
        this.networking = false;
    }

    update(){
        let query = {
            date : this.beerCounter.getDateToday(),
            amount : this.beerCounter.getBeerCount()
        }

        this.queryList.push(query);

        if(!this.networking){
            this.startSendingFile();
        }
    }

    startSendingFile(){
        this.networking = true;

        
        this.networking = false;
    }

    static async build(beerCounter){
        const session = await fileClient.checkSession();

        //krijg een ttl file van de profilecard en parse deze
        let profile = $rdf.sym(session.webId);
        const profileCardTTl = await fileClient.fetch(session.webId);
        const storeProfileCard = $rdf.graph(); 
        await $rdf.parse(profileCardTTl, storeProfileCard, session.webId, "text/turtle");

        //krijg de publictype index
        const publicProfileIndex = await storeProfileCard.any(profile, SOLID("publicTypeIndex"));
        const storePublicTypeIndex = $rdf.graph();
        const publicTypeIndexTTL = await fileClient.fetch(publicProfileIndex.value);
        await $rdf.parse(publicTypeIndexTTL, storePublicTypeIndex, publicProfileIndex.value, "text/turtle");

        //vind de app in de publictypeindex
        let app = $rdf.sym(publicProfileIndex.value + "#BeerCounter");
        let appQuery = await storePublicTypeIndex.any(app, SOLID("instance"));

        let applicationLocation;

        if(!appQuery){
            applicationLocation = await this.createAppNodeForPublicTypeIndex(storePublicTypeIndex, publicProfileIndex, app);
        }else{
            //krijg hier de applocatie
            //TODO
            applicationLocation = $rdf.sym("https://ozcanseker.inrupt.net/public/beercounter.ttl");
        }

        //haal de applicatie file op
        let appStore = $rdf.graph();
        let appTTL = await fileClient.fetch(applicationLocation.value);


        await $rdf.parse(appTTL, appStore, applicationLocation.value , "text/turtle");

        //maak een aantal nodes
        // let newAppFile = await this.addExampleNodes(appStore, applicationLocation);
        // await fileClient.updateFile(applicationLocation.value, newAppFile);

        let map = this.getDatesAndCountsFromStore(appStore);

        beerCounter.setCountsPerDate(map);

        return new SolidCommuncator(session.webId, applicationLocation.value, appStore, beerCounter);
    }   

    static getDatesAndCountsFromStore(store){
        let blankNodes = store.each(null , null, BEERCOUNTER('BeerCounterRecord'));
        let map = new Map();

        blankNodes.forEach(element => {
            let value = store.any(element, RDF('value'));
            let date = store.any(element, TERMS('created'));
            date = dateToString(new Date(date.value));

            map.set(date, value.value);
        });

        return map;
    }

    static async createAppNodeForPublicTypeIndex(store, publicTypeIndex, app){
        //TODO check if there is a file here otherwise make a new file
        let applicationLocation = $rdf.sym("https://ozcanseker.inrupt.net/public/beercounter.ttl");
        await fileClient.updateFile(applicationLocation.value, "");
        
        let type = $rdf.sym("https://ozcanseker.inrupt.net/vocabulary#BeerCounterRecord");

        store.add(publicTypeIndex, TERMS('references'), app);
        store.add(app, RDF('type'), SOLID('TypeRegistration'));
        store.add(app, SOLID('forClass'), type);
        store.add(app, SOLID('instance'), applicationLocation);
        
        let newTTLpublicTypeindex = await $rdf.serialize(undefined, store, publicTypeIndex.value, 'text/turtle');

        await fileClient.updateFile(publicTypeIndex.value, newTTLpublicTypeindex); 

        return applicationLocation;
    }

    static async addExampleNodes(appStore, applocation){
        let bnode = $rdf.blankNode();
        let bnode1 = $rdf.blankNode();
        let bnode2 = $rdf.blankNode();
        let bnode3 = $rdf.blankNode();

        appStore.add(applocation, TERMS('references'), bnode);
        appStore.add(applocation, TERMS('references'), bnode1);
        appStore.add(applocation, TERMS('references'), bnode2);
        appStore.add(applocation, TERMS('references'), bnode3);

        appStore.add(bnode, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
        appStore.add(bnode, RDF('value'), 4);        
        appStore.add(bnode, TERMS('created'), stringToDate("17/09/2019"));  

        appStore.add(bnode1, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
        appStore.add(bnode1, RDF('value'), 5);        
        appStore.add(bnode1, TERMS('created'), stringToDate("16/09/2019"));  
        
        appStore.add(bnode2, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
        appStore.add(bnode2, RDF('value'), 16);        
        appStore.add(bnode2, TERMS('created'), stringToDate("15/09/2019"));  

        appStore.add(bnode3, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
        appStore.add(bnode3, RDF('value'), 2);
        appStore.add(bnode3, TERMS('created'), stringToDate("14/09/2019"));  


        let query = appStore.each(undefined, undefined, BEERCOUNTER('BeerCounterRecord'));
        let query2 = appStore.each(query[0], undefined);

        let newAppFile = await $rdf.serialize(undefined, appStore,'text/turtle');
        return newAppFile;
    }
}

function dateToString(date){
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    var yyyy = date.getFullYear();

    return dd + '/' + mm + '/' + yyyy;
}

function stringToDate(dateString){
    let array = dateString.split('/');
    let date = new Date(array[2], array[1] - 1, array[0]);    
    return date;
}

export default SolidCommuncator;
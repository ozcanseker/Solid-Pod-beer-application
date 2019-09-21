const fileClient = require('solid-file-client');
const $rdf = require('rdflib');

const SOLID = $rdf.Namespace( "http://www.w3.org/ns/solid/terms#");
const TERMS = $rdf.Namespace('http://purl.org/dc/terms/');
const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
const BEERCOUNTER = $rdf.Namespace("https://ozcanseker.inrupt.net/vocabulary#");
const PIM = $rdf.Namespace("http://www.w3.org/ns/pim/space#");

let BEERCOUNTERRECORD = $rdf.sym("https://ozcanseker.inrupt.net/vocabulary#BeerCounterRecord");

class SolidCommuncator{

    /**
     * 
     * @param {string} webid 
     * @param {string} applocation 
     * @param {store:rdflib} appStore 
     * @param {BeerCounter} beerCounter 
     */
    constructor(webid, applocation, appStore, beerCounter){
        this.webid = webid;
        this.applocation = applocation;
        this.appStore = appStore;

        //subscribe to model
        this.beerCounter = beerCounter;
        this.beerCounter.subscribe(this);
        
        //for the networking
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

    async startSendingFile(){
        this.networking = true;

        while(this.queryList.length > 0){
            let query = this.queryList.shift();
            let date = query.date;
            let blankNode = this.appStore.any(null, null, stringToDate(date));

            if(blankNode){
                let statment = this.appStore.any(blankNode, RDF('value'), null);   
                statment.value = query.amount + "";     
            }else{ 
                blankNode = $rdf.blankNode();
                this.appStore.add(blankNode, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
                this.appStore.add(blankNode, TERMS('created'), stringToDate(date));
                this.appStore.add(blankNode, RDF('value'), query.amount);
            }
        }

        let appStoreTTL = await $rdf.serialize(undefined, this.appStore, 'text/turtle');
        console.log(this.applocation);
        await fileClient.updateFile(this.applocation, appStoreTTL);

        if(this.queryList.length > 0){
            this.startSendingFile();
        }else{
            this.networking = false;
        }
    }

    static async build(beerCounter){
        //get the session of the user logged in
        const session = await fileClient.checkSession();
        //make a named node of the session webid of the user
        const profile = $rdf.sym(session.webId);

        //get a store of the profile card of the logged in user
        let storeProfileCard = await this.getUserCard(session);
        
        //store for the Public Profile Index
        let ppiObject = await this.getPPILocation(profile, storeProfileCard);

        //String that shows the location of the public storage of the pod
        let storagePublic = await this.getStorePublic(profile, storeProfileCard);        

        //Gets the location for the application or make a new enty in the Public profile index for the application.
        //also makes an empty file at the application location
        //string
        let applicationLocation = await this.getApplicationLocation(ppiObject.ppi , ppiObject.store, storagePublic);

        //get the application file in store form
        let appStore = await this.getAppStore(applicationLocation);

        //make a few example nodes to fill up the file
        //let newAppFile = await this.addExampleNodes(appStore, applicationLocation);
        //await fileClient.updateFile(applicationLocation.value, newAppFile);

        //update the model BeerCounter with data from the file.
        let map = this.getDatesAndCountsFromStore(appStore);
        beerCounter.setCountsPerDate(map);

        return new SolidCommuncator(session.webId, applicationLocation, appStore, beerCounter);
    }  

    static async getAppStore(applicationLocation){
        let appStore = $rdf.graph();
        let appTTL = await fileClient.fetch(applicationLocation);
        await $rdf.parse(appTTL, appStore, applicationLocation , "text/turtle");
        return appStore;
    }

    static async getApplicationLocation(publicProfileIndex, storePublicProfileIndex, storagePublic){
        let app = $rdf.sym(publicProfileIndex.value + "#BeerCounter");
        let appQuery = storePublicProfileIndex.any(app, SOLID("instance"));

        if(!appQuery){
            //make a new entery in the ppi and make a file for you application
            return await this.createAppNodeForPublicTypeIndex(storePublicProfileIndex, publicProfileIndex, storagePublic, app);
        }else{
            //get the applocation
            return appQuery.value;
        }
    }

    static async getUserCard(session){
        const profileCardTTl = await fileClient.fetch(session.webId); 
        const storeProfileCard = $rdf.graph(); 
        $rdf.parse(profileCardTTl, storeProfileCard, session.webId, "text/turtle");
        return storeProfileCard;
    }
    
    static async getPPILocation(profile, storeProfileCard){
        const publicProfileIndex = storeProfileCard.any(profile, SOLID("publicTypeIndex"));
        const storePublicTypeIndex = $rdf.graph();
        const publicTypeIndexTTL = await fileClient.fetch(publicProfileIndex.value);
        $rdf.parse(publicTypeIndexTTL, storePublicTypeIndex, publicProfileIndex.value, "text/turtle");
        return {store : storePublicTypeIndex, ppi : publicProfileIndex};
    }

    static getStorePublic(profile, storeProfileCard){
        let locationStorage = storeProfileCard.any(profile, PIM("storage"));
        return locationStorage.value + "public";
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

    static async createAppNodeForPublicTypeIndex(store, publicTypeIndex, publicLocation, app){
        //TODO check if there is a file here otherwise make a new file

        let appLocation = publicLocation + "/beercounter.ttl"
        await fileClient.updateFile(appLocation, "");

        appLocation = $rdf.sym(appLocation);
        
        store.add(publicTypeIndex, TERMS('references'), app);
        store.add(app, RDF('type'), SOLID('TypeRegistration'));
        store.add(app, SOLID('forClass'), BEERCOUNTERRECORD);
        store.add(app, SOLID('instance'), appLocation);
        
        let newTTLpublicTypeindex = await $rdf.serialize(undefined, store, publicTypeIndex.value, 'text/turtle');

        await fileClient.updateFile(publicTypeIndex.value, newTTLpublicTypeindex); 

        return appLocation.value;
    }

    static async addExampleNodes(appStore, applocation){
        applocation = $rdf.sym(applocation);
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

        // let query = appStore.each(undefined, undefined, BEERCOUNTER('BeerCounterRecord'));
        // let query2 = appStore.each(query[0], undefined);

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
    let date = new Date(Date.UTC(array[2], array[1] - 1, array[0]));    
    return date;
}

export default SolidCommuncator;
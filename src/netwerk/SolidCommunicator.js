const fileClient = require('solid-file-client');
const authClient = require('solid-auth-client');
const rdfLib = require('rdflib');

const SOLID = rdfLib.Namespace( "http://www.w3.org/ns/solid/terms#");
const TERMS = rdfLib.Namespace('http://purl.org/dc/terms/');
const RDF = rdfLib.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
const BEERCOUNTER = rdfLib.Namespace("https://ozcanseker.inrupt.net/vocabulary#");
const PIM = rdfLib.Namespace("http://www.w3.org/ns/pim/space#");
const ACL = rdfLib.Namespace("http://www.w3.org/ns/auth/acl#");

let BEERCOUNTERRECORD = rdfLib.sym("https://ozcanseker.inrupt.net/vocabulary#BeerCounterRecord");

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
                blankNode = rdfLib.blankNode();
                this.appStore.add(blankNode, RDF('type'), BEERCOUNTER('BeerCounterRecord'));
                this.appStore.add(blankNode, TERMS('created'), stringToDate(date));
                this.appStore.add(blankNode, RDF('value'), query.amount);
            }
        }

        let appStoreTTL = await rdfLib.serialize(undefined, this.appStore, 'text/turtle');
        console.log(this.applocation);
        await putSolidFile(this.applocation, appStoreTTL);

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
        const profile = rdfLib.sym(session.webId);

        //get a store of the profile card of the logged in user
        let storeProfileCard = await this.getUserCard(session);

        try{
            this.checkacess(storeProfileCard);
        }catch(e){
            throw e;
        }

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

        // // //update the model BeerCounter with data from the file.
        let map = this.getDatesAndCountsFromStore(appStore);
        beerCounter.setCountsPerDate(map);

        return new SolidCommuncator(session.webId, applicationLocation, appStore, beerCounter);
    }  

    static checkacess(storeProfileCard){
        let blankNode = storeProfileCard.any(undefined, ACL('origin'),rdfLib.sym("https://ozcanseker.github.io"));
        let readAcess = storeProfileCard.match(blankNode, ACL('mode'), ACL('Read'));
        let Write = storeProfileCard.match(blankNode, ACL('mode'),ACL('Write'));
        let Append = storeProfileCard.match(blankNode, ACL('mode'),ACL('Append'));
        
        if(!readAcess.length){
            throw new Error("No Read acess");
        }

        if(!Write.length){
            throw new Error("No Write acess");
        }

        if(!Append.length){
            throw new Error("No Append acess");
        }
    }

    static async getAppStore(applicationLocation){
        let appStore = rdfLib.graph();
        let appTTL = await fileClient.fetch(applicationLocation);
        await rdfLib.parse(appTTL, appStore, applicationLocation , "text/turtle");
        return appStore;
    }

    static async getApplicationLocation(publicProfileIndex, storePublicProfileIndex, storagePublic){
        let app = rdfLib.sym(publicProfileIndex.value + "#BeerCounter");
        let appQuery = storePublicProfileIndex.any(app, SOLID("instance"));

        if(!appQuery){
            //make a new entery in the ppi and make a file for you application
            return await this.createAppNodeForPublicTypeIndex(storePublicProfileIndex, publicProfileIndex, storagePublic, app);
        }else{
            await this.checkIntegrity(appQuery.value, storagePublic);
            //get the applocation
            return appQuery.value;
        }
    }

    static async checkIntegrity(applocation, storagePublic){
        let res = await authClient.fetch(applocation);
        if(res.status === 404){
            await postSolidFile(storagePublic, applocation.match("[^\/]+$")[0].replace(".ttl", "") ,"");
            console.log("app not found");
        }
    }

    static async getUserCard(session){
        const profileCardTTl = await fileClient.fetch(session.webId); 
        const storeProfileCard = rdfLib.graph(); 
        rdfLib.parse(profileCardTTl, storeProfileCard, session.webId, "text/turtle");
        return storeProfileCard;
    }
    
    static async getPPILocation(profile, storeProfileCard){
        const publicProfileIndex = storeProfileCard.any(profile, SOLID("publicTypeIndex"));
        const storePublicTypeIndex = rdfLib.graph();
        const publicTypeIndexTTL = await fileClient.fetch(publicProfileIndex.value);
        rdfLib.parse(publicTypeIndexTTL, storePublicTypeIndex, publicProfileIndex.value, "text/turtle");
        return {store : storePublicTypeIndex, ppi : publicProfileIndex};
    }

    static getStorePublic(profile, storeProfileCard){
        let locationStorage = storeProfileCard.any(profile, PIM("storage"));
        return locationStorage.value + "public/";
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
        let appLocation = await findEmptyFile(publicLocation);
        await postSolidFile(publicLocation, appLocation, "");

        appLocation = publicLocation + appLocation + '.ttl';
        appLocation = rdfLib.sym(appLocation);
        
        store.add(publicTypeIndex, TERMS('references'), app);
        store.add(app, RDF('type'), SOLID('TypeRegistration'));
        store.add(app, SOLID('forClass'), BEERCOUNTERRECORD);
        store.add(app, SOLID('instance'), appLocation);
        
        let newTTLpublicTypeindex = await rdfLib.serialize(undefined, store, publicTypeIndex.value, 'text/turtle');

        await putSolidFile(publicTypeIndex.value, newTTLpublicTypeindex);

        return appLocation.value;
    }
}
   
async function findEmptyFile(publicLocation){    
    let appLocation = publicLocation + 'beercounter'
  
    let res = await authClient.fetch(appLocation + '.ttl');
    if(res.status % 400 < 100){
      return 'beercounter';
    }else{
      return appLocation =  'beercounter' + makeRandomString(10);
    }
  }
  
  function makeRandomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
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

async function postSolidFile(folder, filename , body){
    authClient.fetch(folder, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/turtle',
        'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"',
        'SLUG' : filename
      },
      body : body
  });
}
  
async function putSolidFile(url, body){
authClient.fetch(url, {
    method: 'PUT',
    headers: {
        'Content-Type': 'text/turtle'      
    },
    body: body
});
}

export default SolidCommuncator;
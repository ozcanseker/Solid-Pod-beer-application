class BeerCounter {
    constructor(){
        this.subscribers = []; 
        this.countsPerDate = new Map();
    }

    getOrderedDateList(){
        let arr = Array.from(this.countsPerDate.keys()).sort().reverse();
        return arr;
    }

    getValueOnDate(date){
       return this.countsPerDate.get(date);
    }

    setCountsPerDate(map){
        this.countsPerDate = map;
        this.upDateSubScribers();
    }

    getBeerCount(){
        if(this.countsPerDate.has(this.dateToday())){
            return this.getValueOnDate(this.dateToday());
        }else{
            return 0;
        }
    }

    getDateToday(){
        return this.dateToday();
    }

    increaeCountToday(){
        let date = this.dateToday();
        let count;

        if(this.countsPerDate.has(date)){
            count = this.countsPerDate.get(date);
        }else{
            count = 0;
        }

        count++;

        this.countsPerDate.set(date, count);

        this.upDateSubScribers();
    }

    upDateSubScribers(){
        this.subscribers.map(subscriber => subscriber.update());
    }

    subscribe(subscriber){
        this.subscribers.push(subscriber);
    }

    unsubscribe(subscriber){
        this.subscribers.filter(subscriberList  => {
            return subscriberList === subscriber;
        });
    }

    dateToday(){
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
      
        return dd + '/' + mm + '/' + yyyy;
    }
}

export default BeerCounter;
# Intro

This is an application that works with a Solid pod.  
It allows you to log in and use your solid pod as a place to save the app data.  
For more info about solid check : https://solid.inrupt.com/

# Issues and Todo's

- The application keeps replacing the file on the solid pod instead of updating it
- The application does look for the public type index but does not check if the planned location is occupied.
- No documentation
- The application can not find the public folder by navigating from the VCARD. it just assumes that the public folder will be at {webidStoragePlace}/public
- Application does not show the name of the person logged in. 
- Application does not give an error when someone does not give access to read or write.
- Add a link to register and explain to people not familiar with solid how pods work.
- Does not create a correct publicprofileindex.ttl
- When you delete the beercounter.ttl file is stops working.

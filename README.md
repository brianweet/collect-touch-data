## Collecting touch type data

Using [gaia keyboard](https://github.com/timdream/gaia-keyboard-demo) to collect touch data

### What
The most important part of the app is (obviously) the keyboard and the sentence that you have to type.  
You can take your time reading the sentence, once you start typing the timer starts / the timer bar starts decreasing.  
But no pressure, just type like you would do in a normal situation, except for not being able to correct any mistakes ;)

### Time's up!
Or you are super awesome and there are no sentences left!  
Now you can submit your 'score' to the server.
If you run the app more than once, please use **the same nickname**.  
This will allow me to create user specific models based on more than one 'typing session' (which might be too little data, but that is something I don't know yet)

The app registers all touch events and sends them to the server (per sentence), even if you don't submit your score.

### Where
The app can be found at http://brianweet.azurewebsites.net  
Please install as hosted app on a Keon with the app-manager/webIDE because you want all the available screen real estate :)

### Sentence dataset
Right now I use a part of the memorable dataset described here: [Enron mobile dataset](http://keithv.com/pub/enronmobile/mobile_email_dataset.pdf)  
I am going to add the rest of the dataset but that doesn't matter for now.

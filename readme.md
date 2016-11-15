# **GURPS Space Toolkit** _(gstk)_ ##
---

## **About**
The _GURPS Space Toolkit_, or _GSTK_, is a web-app designed to quickly and easily create, modify, and manage regions of space using the [GURPS Space 4e](http://www.sjgames.com/gurps/books/Space/) rules.


### **License**

_GURPS 4e_ is a trademark of _Steve Jackson Games_, and its rules and art are copyrighted by _Steve Jackson Games_. All rights are reserved by _Steve Jackson Games_. This game aid is the original creation of Bryan Miller and is released for free distribution, and not for resale, under the permissions granted in the [Steve Jackson Games Online Policy](http://www.sjgames.com/general/online_policy.html).


#### **What Can it Do?**

Since the GURPS rules actually do not cover regions of space, the program (at present) allows the user to create regions in increments of 3 parsecs radially with no two stars being closer than 1 parsec.

Once a Region is created, it can be filled with stars, each of which can contain companion stars and orbital bodies (Terrestrials, Gas Giants, and Asteroid Belts at present).

From the Region level down to the orbital bodies, each element can be created randomly or each star/body can be turned as the user desires.

> **NOTE:** When defining stars and bodies, the result is rarely exactly as specified. The system will tweak given values to properly conform to GURPS Space rules.

Regions can also be both imported and exported via JSON.

> **NOTE:** As long as the JSON is formatted correctly, no values in the JSON string is checked during import. This will allow advanced users to tweak their space region even more.

#### **What Can't it Do?** _(but will eventually)_

At present, there is no support for moons or other satellites around orbital bodies.

The editing features unfortunately do not yet handle the repositioning of already placed stars or orbital bodies.

Stars and orbital bodies cannot be imported via JSON on their own.

Stars and orbital bodies cannot be renamed once created _(though, you can alter their names in the JSON)_

#### **What Do I Want it to Do?**

The long term goal is to also include spaceships (as described via [GURPS Spaceships](http://www.sjgames.com/gurps/books/spaceships/)) and allow users to design spaceships, which can then be used to calculate transit times and track locations within their region of space.

... This bit... could take a **while**

## **Installation**

Clone this git repository into a folder of your choice.

Navigate to that folder than execute...

    npm install

which will download all of the required modules for the app.

Finally, you can either directly open the index.html file in the browser of your choice or you can run the application using [NodeJS-Webkit / NWJS](https://github.com/nwjs/nw.js/) by coping the nwjs executable files into the app directory and executing...

	nw .

> **NOTE:** At present, _GSTK_ was written and tested using Chromium and the V8 Javascript engine. No testing was done for any other browser or Javascript runtime. There is no guarantee, at present, this app will work with any browser or runtime other than mentioned above.

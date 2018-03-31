## Empty Webpack Project

### How to Use

In this empty project, the index.html is generated automatically (though that
can be changed). All it does is load the generated dist/bundle.js and any other
assets that have been imported.

To build the output, you need to be at empty-webpack-project and type: 

    npm run build:dev
   
or

    npm run build:prod

to build dev or production builds, respectively.

If you want webpack to continually watch your code and rebuild when it changes,
use:
   
    npm run watch
    
This will build the dev version when a file changes.

Your output should be fully included in dist.


### Creating HTML

Any HTML templating tools can be used. I have included my own one (src/jayesstee.js) that I like
to use that lets you write HTML using javascript directly (see src/templates.js). Using this
you can simply do things like:

```
   // remove need to prefix everything with jst.
   jst.makeGlobal(); 
   
   jst("body").appendChild(
     $div({cn: "my-class-name", otherParam: "my-random-param"},
       $ul(
         $li("first item"),
         $li("second item"),
         $li("third item"),
       )
   ));
```

This will fill the body of the HTML with a div and an unordered list.


### Other Help

A great place to understand webpack is: https://webpack.js.org/guides/getting-started/

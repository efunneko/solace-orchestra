# Solace Orchestra
A distributed music playing game over messaging.


## Starting it up

There are four components that you need to run:

* conductor
* symphony
* dashboard
* musician - in orchestra-hero directory

### Startup for symphony, dashboard and musician

The symphony and dashboard components are in on single-page app that is contained in the `combined` directory. The musician is in its own directory.

All three of these components are javascript single-page apps for the browser. To get them to work, you need to go into each directory (combined and musician) and run:

1. `npm install`
2. `npm run watch` - note that this never exits, so you will need a separate terminal for each

This will run a webpack-dev-server that will serve up the SPA.

To run a component, you should be able to go to: 

  * Dashboard/Symphony:  http://localhost:8888/
  * Musician:            http://localhost:8889/

### Startup for conductor

For the conductor, the easiest way to run it is to do:

1. Navigate to solace-orchestra/conductor/conductor
2. Run the following:

```
  virtualenv -p python3 env
  . env/bin/activate
  pip install -r ../requirements.txt
```

Next you need a credentials file in your home directory called `solace.cloud`. Its contents are:

```
  url=<solace-cloud-service-url>
  port=<mqtt-port>
  username=<username>
  password=<password>
```


After than, run the conductor with:

```
  python3 conductor.py
```



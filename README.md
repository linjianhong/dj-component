# dj-component

## Guide

* quick form setup
* quick pop components

## Demo

[Demo](https://linjianhong.github.io/dj-component/demo/index.html)


## Installation

Installation is easy as dj-component has minimal dependencies - only the AngularJS and ngAnimate are required. Include ngAnimate in the module dependencies for your app in order to enable animation.

#### Download

Download js/css files inside the `dist` floder as it need.


#### Install with Bower
$ bower install dj-component


## Usage

#### Use after download

```
<link rel="stylesheet" href="yourlibpath/dj-component-0.1.2.css" />

<!-- after include angular.js  -->
<script src="yourlibpath/dj-component-0.1.2.js"></script>
```


#### Use with Bower
add dependencies in `bower.json` like this:
```
  "dependencies": {
    "angular": "^1.6.1",
    "angular-animate": "^1.6.1",
    "dj-component": "0.1.2",
    //...
  }
```


#### incluce the angular modules as need

```
  angular.module('my-app', [
    'dj-form',
    'dj-ui',
    'dj-pop',
    // ...
    'ngAnimate'
  ]);
```
## Form

* input
* dropdown
* combobox
* star
* tags
* imgs-uploader

## Pop

* gallery
* toast
* show user component
* comment






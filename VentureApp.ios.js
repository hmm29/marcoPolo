/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @flow
 */

'use strict';

var React = require('react-native');
var {
  AppRegistry,
  Navigator,
  StyleSheet,
  View
} = React;

var Home = require('./Pages/Home');

var VentureApp = React.createClass({
   componentDidMount() {

  },

  renderScene(route:{title:string, component: Object, passProps?: Object}, navigator:Object) {
      var Component = route.component;
      var passProps = route.passProps;

      return (
          <View style={styles.container}>
              <Component navigator={navigator}
                         route={route}
                         passProps={passProps}/>
          </View>
      );
  },

  render: function() {
    return (
         <Navigator 
          style={styles.container}
          renderScene={this.renderScene}
          configureScene={(route) => {
            if (route.sceneConfig) {
              return route.sceneConfig;
            }
            return Navigator.SceneConfigs.FloatFromRight;
          }}
          initialRoute={{
            title: 'Home',
            component: Home
          }} />
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigator: {
    backgroundColor: '#F5FCFF'
  }
});

AppRegistry.registerComponent('VentureApp', () => VentureApp);

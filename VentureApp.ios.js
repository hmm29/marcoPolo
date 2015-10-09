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
  StatusBarIOS,
  StyleSheet,
  View
} = React;

var Home = require('./Pages/Home');

import type { NavigationContext } from 'NavigationContext';

type Navigator = {
    navigationContext: NavigationContext,
    push: (route: {title: string, component: ReactClass<any,any,any>}) => void
}

var VentureApp = React.createClass({

    componentDidMount() {
        var Orientation = require('react-native-orientation');
        Orientation.lockToPortrait();

        StatusBarIOS.setStyle('light-content', true);
    },

  renderScene(route:{title:string, component:ReactClass<any,any,any>, passProps?:Object}, navigator: Navigator) {
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
    flex: 1
  },
  navigator: {
  }
});

AppRegistry.registerComponent('VentureApp', () => VentureApp);

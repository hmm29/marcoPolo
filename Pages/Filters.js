/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Filters
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    AsyncStorage,
    SliderIOS,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    View,
    } = React;

var _ = require('lodash');
var CloseIcon = require('../Partials/Icons/CloseIcon');
var Display = require('react-native-device-display');

var SCREEN_HEIGHT = Display.height;

var Filters = React.createClass({
    getInitialState() {
        return {
            distance: 10.0,
            gender: ['male', 'female', 'other'],
            privacy: ['friends', 'friends+']
        };
    },

    componentDidMount() {
        var _this = this;

        AsyncStorage.multiGet([
            '@AsyncStorage:Venture:settings:distance',
            '@AsyncStorage:Venture:settings:gender',
            '@AsyncStorage:Venture:settings:privacy'])
            .then((value:Array<Array>) => {
                _this.setState({
                    distance: value[0][1],
                    gender: value[2][1] && (value[2][1]).split(','),
                    privacy: value[3][1] && (value[3][1]).split(','),
                    originalDistance: value[0][1],
                    originalGender: value[2][1] && (value[2][1]).split(','),
                    originalPrivacy: value[3][1] && (value[3][1]).split(',')
                })
            })
            .catch((error) => console.log(error.message))
            .done();
    },

    saveFilters() {
        if (this.state.gender.length === 0) {
            this.setState({
                gender: ['male', 'female', 'other']
            })
        }

        if (this.state.privacy.length === 0) {
            this.setState({
                privacy: ['friends', 'friends+', 'all']
            })
        }


        var _this = this;
        var settingsChanges = {
            matchingPreferences: {
                ageRangeLower: 22,
                ageRangeUpper: 28,
                genderPreferences: _this.state.gender,
                maxSearchDistance: _this.state.distance
            }
        };

        AsyncStorage.getItem('@AsyncStorage:Venture:account')
            .then((account:string) => {
                if (!JSON.parse(account)) return;

                account = JSON.parse(account);

                // @HM: Only set if current values different from originals
                if (!(_.isEqual(_this.state.originalDistance, _this.state.distance)
                    && _.isEqual(_this.state.originalGender, _this.state.gender)
                    && _.isEqual(_this.state.originalPrivacy, _this.state.privacy))) {

                    ddpClient.connect(() => {
                        ddpClient.call('Accounts.updateUser', [{ventureId: account.ventureId}, settingsChanges, account.ventureId, account.name, account.email],
                            function (err, resp) {
                                if (resp) {
                                    AsyncStorage.multiSet([
                                        ['@AsyncStorage:Venture:settings:distance', (_this.state.distance).toString()],
                                        ['@AsyncStorage:Venture:settings:gender', _this.state.gender.toString()],
                                        ['@AsyncStorage:Venture:settings:privacy', _this.state.privacy.toString()]
                                    ])
                                        .then(() => console.log('Saved settings to disk.' + 'distance: ' + (_this.state.distance).toString() + 'gender' + _this.state.gender.toString() + 'privacy :' + _this.state.privacy.toString()))
                                        .catch((error) => console.log(error.message))
                                        .done();
                                }
                                if (err) alert(err.message);

                                ddpClient.close();
                            });
                    });
                }
            })
            .catch((error) => console.log(error.message))
            .done();
    },

    _setButtonState(field:string, value:string) {
        if (field === 'gender') return (this.state.gender.indexOf(value) > -1 ? styles.tabButtonGenderActive : styles.tabButtonGenderInactive);

        else if (field === 'privacy') return (this.state.privacy.indexOf(value) > -1 ? styles.tabButtonPrivacySettingsActive : styles.tabButtonPrivacySettingsInactive);
    },

    setGendersToIncludeFemale() {
        var genderArr = this.state.gender,
            idx = genderArr.indexOf('female');

        if (idx > -1) genderArr.splice(idx, 1);
        else genderArr.push('female');

        this.setState({
            gender: genderArr
        });
    },

    setGendersToIncludeMale() {
        var genderArr = this.state.gender,
            idx = genderArr.indexOf('male');

        if (idx > -1) genderArr.splice(idx, 1);
        else genderArr.push('male');

        this.setState({
            gender: genderArr
        });
    },

    setGendersToIncludeOther() {
        var genderArr = this.state.gender,
            idx = genderArr.indexOf('other');

        if (idx > -1) genderArr.splice(idx, 1);
        else genderArr.push('other');

        this.setState({
            gender: genderArr
        });
    },

    setPrivacyToAll() {
        var privacyArr = this.state.privacy;

        if (JSON.stringify(privacyArr) === JSON.stringify(['friends', 'friends+', 'all'])) privacyArr.pop();
        else privacyArr = ['friends', 'friends+', 'all'];

        this.setState({
            privacy: privacyArr
        });
    },

    setPrivacyToFriends() {
        var privacyArr = this.state.privacy;

        if (JSON.stringify(privacyArr) === JSON.stringify(['friends'])) privacyArr.pop();
        else privacyArr = ['friends'];

        this.setState({
            privacy: privacyArr
        });
    },

    setPrivacyToFriendsPlus() {
        var privacyArr = this.state.privacy;

        if (JSON.stringify(privacyArr) === JSON.stringify(['friends', 'friends+'])) privacyArr.pop();
        else privacyArr = ['friends', 'friends+'];

        this.setState({
            privacy: privacyArr
        });
    },

    render() {
        return (
            <View style={{flex: 1}}>
                <View>
                    {this._renderHeader()}
                </View>
                <View style={styles.container}>
                    <View style={styles.section}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>
                                Distance: {(Math.round(100 * this.state.distance) / 100).toFixed(1)} miles
                            </Text>
                        </View>
                        <View style={styles.sliderContainer}>
                            <SliderIOS
                                style={styles.slider}
                                minimumTrackTintColor='#2B91FF'
                                onValueChange={(distance) => this.setState({distance: distance})}
                                minimumValue={0.1}
                                maximumValue={10}
                                value={JSON.parse(this.state.distance)}/>
                        </View>
                    </View>
                    <View style={styles.space}></View>
                    <View style={styles.section}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>
                                Gender:
                            </Text>
                        </View>
                        <View style={styles.tabSettingsGender}>
                            <TouchableHighlight style={this._setButtonState('gender', 'male')}
                                                onPress={this.setGendersToIncludeMale}
                                                underlayColor='white'>
                                <Text style={styles.tabButtonText}> Male </Text>
                            </TouchableHighlight>
                            <TouchableHighlight style={this._setButtonState('gender', 'female')}
                                                onPress={this.setGendersToIncludeFemale}
                                                underlayColor='white'>
                                <Text style={styles.tabButtonText}> Female </Text>
                            </TouchableHighlight>
                            <TouchableHighlight style={this._setButtonState('gender', 'other')}
                                                onPress={this.setGendersToIncludeOther}
                                                underlayColor='white'>
                                <Text style={styles.tabButtonText}> Other </Text>
                            </TouchableHighlight>
                        </View>
                    </View>
                    <View style={styles.space}></View>
                    <View style={styles.section}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleText}>
                                Privacy:
                            </Text>
                        </View>
                        <View style={styles.tabSettingsPrivacy}>
                            <TouchableHighlight style={this._setButtonState('privacy', 'friends')}
                                                onPress={this.setPrivacyToFriends}
                                                underlayColor='white'>
                                <Text style={styles.tabButtonText}> Friends </Text>
                            </TouchableHighlight>
                            <TouchableHighlight style={this._setButtonState('privacy', 'friends+')}
                                                onPress={this.setPrivacyToFriendsPlus}
                                                underlayColor='white'>
                                <Text style={styles.tabButtonText}> Friends + </Text>
                            </TouchableHighlight>
                            <TouchableHighlight style={this._setButtonState('privacy', 'all')}
                                                onPress={this.setPrivacyToAll}
                                                underlayColor='white'>
                                <Text style={styles.tabButtonText}> All </Text>
                            </TouchableHighlight>
                        </View>
                    </View>
                    <TouchableOpacity onPress={this.saveFilter}
                                      style={{backgroundColor: '#040A19', alignSelf: 'center', top: 16, borderRadius: 4, paddingHorizontal: 30, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        <Text
                            style={{color: '#fff', fontSize: 15, fontFamily: 'AvenirNextCondensed-Medium'}}>S A V E</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    },

    _renderHeader() {
        return (
            <View style={styles.header}>
                <Text
                    style={{color: '#fff', fontSize: 22, fontFamily: 'AvenirNextCondensed-Regular'}}>SEARCH  PREFERENCES </Text>
                <View style={{position: 'absolute', top: 25, left: 320, right: 0}}>
                    <CloseIcon onPress={() => this.props.navigator.pop()} />
                </View>
            </View>
        );
    },

});

var styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#FFF5EA',
        height: SCREEN_HEIGHT-80
    },
    header: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#040A19',
        paddingTop: 30,
        paddingBottom: 15
    },
    section: {
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: '#040A19',
        bottom: 18
    },
    slider: {
        height: 30,
        margin: 8
    },
    sliderContainer: {
        padding: 8,
        backgroundColor: '#fff'
    },
    space: {
        height: 30
    },
    tabButtonGenderActive: {
        backgroundColor: '#2B91FF',
        borderRadius: 7,
        padding: 10,
        borderColor: '#fafafa',
        borderWidth: 2,
        width: 75
    },
    tabButtonGenderInactive: {
        backgroundColor: '#2B91FF',
        borderRadius: 7,
        padding: 10,
        borderColor: '#fafafa',
        borderWidth: 1,
        opacity: 0.4,
        width: 75
    },
    tabButtonText: {
        color: 'white',
        fontFamily: 'AvenirNextCondensed-Regular',
        textAlign: 'center'
    },
    titleContainer: {
        backgroundColor: '#040A19',
        paddingHorizontal: 10,
        paddingVertical: 5
    },
    tabButtonPrivacySettingsActive: {
        backgroundColor: '#2B91FF',
        borderRadius: 7,
        padding: 10,
        borderColor: '#fafafa',
        borderWidth: 2,
        width: 75
    },
    tabButtonPrivacySettingsInactive: {
        backgroundColor: '#2B91FF',
        borderRadius: 7,
        padding: 10,
        borderColor: '#fafafa',
        borderWidth: 1,
        opacity: 0.4,
        width: 75
    },
    tabSettingsGender: {
        flexDirection: 'row',
        paddingVertical: 25,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    tabSettingsPrivacy: {
        flexDirection: 'row',
        paddingVertical: 25,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    titleText: {
        fontSize: 22,
        fontFamily: 'AvenirNextCondensed-Regular',
        color: '#eee'
    }
});

module.exports = Filters;
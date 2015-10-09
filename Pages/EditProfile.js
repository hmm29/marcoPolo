/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule EditProfile
 * @flow
 */

var React = require('react-native');

var {
    AsyncStorage,
    Image,
    LayoutAnimation,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
    } = React;

var _ = require('lodash');
var AutoComplete = require('react-native-autocomplete');
var BackIcon = require('../Partials/Icons/BackIcon');
var Display = require('react-native-device-display');
var GenderList = require('../data/genders.json').genders;
var { Icon, } = require('react-native-icons');

var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;

String.prototype.capitalize = function () {
    return this.replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
    });
};

var EditProfile = React.createClass({
    statics: {
        title: '<EditProfile>',
        description: 'Edit current user data.'
    },

    getInitialState() {
        return {
            autocompleteActive: false,
            bio: '',
            bioVisible: true,
            genderMatches: [],
            hasKeyboardSpace: false,
            isEditingGender: false,
            selectedGender: 'male'
        }
    },

    componentWillMount() {
        var _this = this;

        AsyncStorage.getItem('@AsyncStorage:Venture:account')
            .then((account) => {
                account = JSON.parse(account);
                if (account)
                    _this.setState({
                        bio: account.bio,
                        currentUserActivityPreference: account.activityPreference,
                        currentUserAge: account.ageRange.min,
                        currentUserBio: account.bio,
                        currentUserID: account._id,
                        currentUserName: account.name,
                        currentUserThumbnailURL: account.picture,
                        gender: account.gender
                    });
            })
            .catch((error) => console.log(error.message))
            .done();
    },

    _onTyping(text:string) {
        var genderMatches =
            _.filter(GenderList, function (n) {
                return _.startsWith(n.toLowerCase(), text.toLowerCase());
            });

        this.setState({genderMatches});
    },

    _setGender(selectedGender:string) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({selectedGender: selectedGender.toLowerCase(), isEditingGender: false}); // schema accepts only lower-case values
    },

    render() {

        var bio = (
            <View style={{flexDirection: 'row', alignItems: 'center', margin: 10, justifyContent: 'space-between', bottom: 30}}>
                <Text
                    style={styles.tabText}>Bio</Text>
                <TextInput
                    onBlur={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({hasKeyboardSpace: false})
                        }}
                    onFocus={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({hasKeyboardSpace: true})
                        }}
                    autoCapitalize='none'
                    autoCorrect={false}
                    onChangeText={(text) => {
                            this.setState({bio: text});
                        }}
                    maxLength={15}
                    returnKeyType='done'
                    style={styles.bio}
                    value={this.state.bio}/>
            </View>
        );

        var currentGenderAndEditGenderToggle = (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 10}}>
                <Text
                    style={styles.tabText}>{this.state.selectedGender && this.state.selectedGender.capitalize()}</Text>
                <TouchableOpacity onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                this.setState({isEditingGender: true})
                }}>
                    <Icon
                        color="rgba(255,255,255,0.7)"
                        name="ion|edit"
                        size={18}
                        style={{width: 18, height: 18}}
                        />
                </TouchableOpacity>
            </View>
        );

        var editGenderAutocomplete = (
            <View style={{margin: 10}}>
                <AutoComplete
                    onBlur={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({autocompleteActive: false, isEditingGender: false, hasKeyboardSpace: false, bioVisible: true})
                        }}
                    onFocus={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({autocompleteActive: true, isEditingGender: true, hasKeyboardSpace: true, bioVisible: false})
                        }}
                    clearTextOnFocus={true}
                    placeholder='Edit gender'
                    autoCompleteFontSize={15}
                    autoCompleteRegularFontName='AvenirNextCondensed-Regular'
                    autoCompleteBoldFontName='AvenirNextCondensed-Medium'
                    applyBoldEffectToAutoCompleteSuggestions={true}
                    onSelect={this._setGender}
                    onTyping={this._onTyping}
                    suggestions={this.state.genderMatches}
                    autoCompleteTableCellTextColor={'#fff'}
                    autoCompleteTableOriginOffset={0}
                    autoCompleteTableViewHidden={false}
                    showTextFieldDropShadowWhenAutoCompleteTableIsOpen={false}
                    autoCompleteRowHeight={34}
                    style={[styles.autocomplete, {height: (this.state.isEditingGender ? SCREEN_WIDTH / 9 : 40), marginRight: (this.state.bioVisible ? 0 : 90), paddingBottom: (this.state.bioVisible ? 0 : 60) }]}
                    />
            </View>
        );

        return (
            <View style={{flex: 1}}>
                <View>
                    {this.renderHeader()}
                </View>
                <View style={[styles.tabContent, {bottom: this.state.hasKeyboardSpace ? SCREEN_HEIGHT/ 3 : 0}]}>
                    <Image source={require('image!about')} style={[styles.editProfileContainer]}>
                        <Image source={{uri: this.state.currentUserThumbnailURL}} style={styles.thumbnail}/>
                        <Text
                            style={[styles.tabText, {fontSize: 22}]}>{this.state.currentUserName}{this.state.currentUserName ? ',' : ''}  {this.state.currentUserAge}</Text>

                        <View style={{flexDirection: 'column', alignItems: 'flex-start', right: 10, bottom: 15}}>
                            {this.state.isEditingGender ? editGenderAutocomplete : currentGenderAndEditGenderToggle}

                            {this.state.bioVisible ? bio : <View />}

                        </View>
                        <TouchableOpacity onPress={() => this.props.navigator.pop()}
                                          style={{top: (this.state.bioVisible ? 10 : 60), backgroundColor: '#040A19', alignSelf: 'center', borderRadius: 4, paddingHorizontal: 30, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                            <Text
                                style={{color: '#fff', fontSize: 15, fontFamily: 'AvenirNextCondensed-Medium'}}>S A V E</Text>
                        </TouchableOpacity>
                    </Image>
                </View>
            </View>
        )
    },

    renderHeader() {
        return (
            <View style={styles.header}>
                <TouchableOpacity onPress={() => this.props.navigator.pop()} style={{right: 30}}>
                    <Icon
                        color="#fff"
                        name="ion|ios-arrow-thin-left"
                        size={32}
                        style={{width: 32, height: 32}}
                        />
                </TouchableOpacity>
                <Text
                    style={{color: '#fff', right: 10, fontSize: 22, paddingVertical: 10, fontFamily: 'AvenirNextCondensed-Medium'}}>
                    EDIT PROFILE </Text>
                <Text />
            </View>
        )
    }
});

var styles = StyleSheet.create({
    autocomplete: {
        backgroundColor: 'rgba(9,24,58,0.3)',
        color: '#fff',
        width: SCREEN_WIDTH / 2,
        borderRadius: 10,
        paddingLeft: SCREEN_WIDTH / 25,
        marginBottom: SCREEN_HEIGHT / 22,
        left: 60,
        alignSelf: 'stretch'
    },
    bio: {
        backgroundColor: 'rgba(9, 24, 58,0.2)',
        width: SCREEN_WIDTH / 2,
        height: SCREEN_WIDTH / 8,
        borderRadius: 10,
        paddingLeft: SCREEN_WIDTH / 25,
        alignSelf: 'center',
        marginVertical: SCREEN_HEIGHT / 90,
        fontFamily: 'AvenirNextCondensed-Regular',
        color: 'white'
    },
    editProfileContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: SCREEN_HEIGHT / 14
    },
    header: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#040A19',
        paddingTop: 20,
        paddingBottom: 5
    },
    tabText: {
        color: 'white',
        fontSize: SCREEN_HEIGHT / 44,
        margin: SCREEN_HEIGHT / 30,
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    thumbnail: {
        width: SCREEN_WIDTH / 1.8,
        height: SCREEN_WIDTH / 1.8,
        borderRadius: SCREEN_WIDTH / 3.6,
        bottom: 10
    }
});

module.exports = EditProfile;
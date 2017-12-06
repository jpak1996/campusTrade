/*
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
import React from 'react';
import {
  View,
  ScrollView,
  Text,
  Animated,
  StyleSheet,
  Image,
  Easing,
  TouchableHighlight
} from 'react-native';
import { Button, ButtonGroup, Icon } from 'react-native-elements';

import {
  CameraRoll,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
  ImageStore,
  Platform,
  ActivityIndicator
} from 'react-native';
import {
  FormLabel,
  FormInput,
  FormValidationMessage
} from 'react-native-elements';

import { DrawerNavigator, NavigationActions, StackNavigator } from 'react-navigation';

import Auth from '../../lib/Categories/Auth';
import Storage from '../../lib/Categories/Storage';
import API from '../../lib/Categories/API';
import AddItem from './AddItem';
import ViewItemBuy from './ViewItemBuy';
import ViewItems from './ViewItems';
import UploadPhoto from '../Components/UploadPhoto';
import SideMenuIcon from '../Components/SideMenuIcon';
import awsmobile from '../../aws-exports';
import { colors } from 'theme';

let styles = {};

class Buy extends React.Component {
  constructor(props) {
    super(props);

    this.handleRetrieveItem = this.handleRetrieveItem.bind(this);
    this.animate = this.animate.bind(this);
    this.toggleModal = this.toggleModal.bind(this);

    this.animatedIcon = new Animated.Value(0);

    this.state = {
      apiResponse: null,
      loading: true,
      modalVisible: false,
    }
  }

  componentDidMount() {
    this.handleRetrieveItem();
    this.animate();
  }

  animate() {
    Animated.loop(
      Animated.timing(
        this.animatedIcon,
        {
          toValue: 1,
          duration: 1300,
          easing: Easing.linear,
        }
      )
    ).start();
  }

  handleRetrieveItem() {
    const cloudLogicArray = JSON.parse(awsmobile.aws_cloud_logic_custom);
    const endPoint = cloudLogicArray[0].endpoint;
    const requestParams = {
      method: 'GET',
      url: endPoint + '/items/pets',
    };

    API.restRequest(requestParams).then(apiResponse => {
      //alert(JSON.stringify(apiResponse))
      apiResponse.sort(function(a, b) {
        var nameA = a.name.toUpperCase(); // ignore upper and lowercase
        var nameB = b.name.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }

        // names must be equal
        return 0;
      });
      this.setState({ apiResponse, loading: false });
    }).catch(e => {
      this.setState({ apiResponse: e.message, loading: false });
    });
  }

  openDrawer = () => {
    this.props.navigation.navigate('DrawerOpen');
  }

  toggleModal() {
    if (!this.state.modalVisible) {
      this.handleRetrieveItem();
      this.animate();
    }

    this.setState((state) => ({ modalVisible: !state.modalVisible }));
  }

  renderItem(item, index) {
    const uri = item.picKey ? Storage.getObjectUrl(item.picKey) : null;

    //if (item.type == "technology") {
    return (
      <TouchableHighlight
        onPress={() => {
          this.props.navigation.navigate('ViewItemBuy', { item })
        }}
        underlayColor='transparent'
        key={item.petId}
      >
        <View style={styles.itemInfoContainer}>
          <Image
            resizeMode='cover'
            source={uri ? { uri } : require('../../assets/images/profileicon.png')}
            style={styles.itemInfoAvatar}
          />
        <Text style={styles.itemInfoName}>{item.name} - {item.type}</Text>
        </View>
      </TouchableHighlight>
    )
  //}
  }

  render() {
    const { loading, apiResponse } = this.state;
    const spin = this.animatedIcon.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const AddItemRoutes = StackNavigator({
      AddItem: { screen: AddItem },
      UploadPhoto: { screen: UploadPhoto },
    });

    //const item = {"type": "clothes"}

    return (
      <View style={{ flex: 1, paddingBottom: 0 }}>
        <ScrollView style={{ flex: 1 }}>

          <FormLabel>Type</FormLabel>
          <View style={styles.buttonGroupContainer}>
          <Button
            fontFamily='lato'
            containerViewStyle={{ marginTop: 20 }}
            backgroundColor={colors.primary}
            large
            title="Furniture"
            onPress={() => {
              const type = {"type": "furniture"}
              this.props.navigation.navigate('ViewItems', { type })
            }}
          />
          <Button
            fontFamily='lato'
            containerViewStyle={{ marginTop: 20 }}
            backgroundColor={colors.primary}
            large
            title="Technology"
            onPress={() => {
              const type = {"type": "technology"}
              this.props.navigation.navigate('ViewItems', { type })
            }}
          />
          <Button
            fontFamily='lato'
            containerViewStyle={{ marginTop: 20 }}
            backgroundColor={colors.primary}
            large
            title="Clothes"
            onPress={() => {
              const type = {"type": "clothes"}
              this.props.navigation.navigate('ViewItems', { type })
            }}
          />
          </View>
        </ScrollView>
      </View>
    );
  }
};

styles = StyleSheet.create({
  container: {
    padding: 25,
  },
  title: {
    color: colors.darkGray,
    fontSize: 18,
    marginBottom: 15,
  },
  itemInfoContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfoName: {
    color: colors.darkGray,
    fontSize: 20,
    marginLeft: 17
  },
  itemInfoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  }
})



const BuyRouteStack = {
  Buy: {
    screen: (props) => {
      const { screenProps, ...otherProps } = props;
      return <Buy {...props.screenProps} {...otherProps} />
    },
    navigationOptions: (props) => {
      return {
        title: 'Buy',
        headerLeft: <SideMenuIcon onPress={() => props.screenProps.rootNavigator.navigate('DrawerOpen')} />,
      }
    }
  },
  ViewItemBuy: { screen: ViewItemBuy },
  ViewItems: { screen: ViewItems }
};

const BuyNav = StackNavigator(BuyRouteStack);

export default (props) => {
  const { screenProps, rootNavigator, ...otherProps } = props;

  return <BuyNav screenProps={{ rootNavigator, ...screenProps, ...otherProps }} />
};

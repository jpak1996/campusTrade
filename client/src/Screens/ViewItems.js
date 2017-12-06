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
import React, { Component } from 'react';
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
import UploadPhoto from '../Components/UploadPhoto';
import SideMenuIcon from '../Components/SideMenuIcon';
import awsmobile from '../../aws-exports';
import { colors } from 'theme';

let styles = {};

let nameLocationMap = {}

class ViewItems extends React.Component {
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
      url: endPoint + '/items/pets2',
    };

    API.restRequest(requestParams).then(apiResponse => {
        //alert(JSON.stringify(apiResponse))

          /**
           * Round number (value) to a certain number of decimals (decimals)
           */
          function round(value, decimals) {
            return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
          }

          /**
           * Function to convert degrees to toRadians
           */
          if (Number.prototype.toRadians === undefined) {
              Number.prototype.toRadians = function() { return this * Math.PI / 180; };
          }

          /**
           * Creates a LatLon point on the earth's surface at the specified latitude / longitude.
           *
           * Parameters:
           *  number lat - Latitude in degrees.
           *  number lon - Longitude in degrees.
           *
           * Example usage:
           *     var p1 = new LatLon(52.205, 0.119);
           */
          function LatLon(lat, lon) {
              // allow instantiation without 'new'
              if (!(this instanceof LatLon)) return new LatLon(lat, lon);
              this.lat = Number(lat);
              this.lon = Number(lon);
          }


          /**
           * Returns the distance from ‘this’ point to destination point (using haversine formula).
           *
           * Parameters:
           * LatLon: point - Latitude/longitude of destination point.
           * number: [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
           *
           * Returns:
           * number: Distance between this point and destination point, in same units as radius.
           *

           */
          LatLon.prototype.distanceTo = function(point, radius) {
              if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');
              radius = (radius === undefined) ? 6371e3 : Number(radius);

              var R = radius;
              var φ1 = this.lat.toRadians(),  λ1 = this.lon.toRadians();
              var φ2 = point.lat.toRadians(), λ2 = point.lon.toRadians();
              var Δφ = φ2 - φ1;
              var Δλ = λ2 - λ1;

              var a = Math.sin(Δφ/2) * Math.sin(Δφ/2)
                    + Math.cos(φ1) * Math.cos(φ2)
                    * Math.sin(Δλ/2) * Math.sin(Δλ/2);
              var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              var d = R * c;
              d = d * 0.621371; //Converts from kilometers to miles
              d = d/1000;
              if (d >= 10)
              {
                finald = round(d, 0);
              } else {
                finald = round(d, 2);
              }
              return finald;
          };
          /**
           * EXAMPLE OF USAGE:
           *     var p1 = new LatLon(52.205, 0.119);
           *     var p2 = new LatLon(48.857, 2.351);
           *     var d = p1.distanceTo(p2); // 251 mi
           */

      navigator.geolocation.getCurrentPosition(
        (position) => {
          for (i in apiResponse) {
            if (apiResponse[i].breed === undefined) {
              nameLocationMap[apiResponse[i].name] = 0;
            } else {
              var arr = apiResponse[i].breed.split('|');
              var lat = parseFloat(arr[0]);
              var lon = parseFloat(arr[1]);
              var p1 = new LatLon(lat, lon);
              var curr = new LatLon(position.coords.latitude, position.coords.longitude);
              var d = curr.distanceTo(p1);
              nameLocationMap[apiResponse[i].name] = d;
            }
          }

          apiResponse.sort(function(a, b) {
            return nameLocationMap[a.name] - nameLocationMap[b.name];
          });

        this.setState({ apiResponse, loading: false });
        },
        (error) => alert(JSON.stringify(error)),
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 },
      );
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

  renderItem(item, index, typename) {
    const uri = item.picKey ? Storage.getObjectUrl(item.picKey) : null;
    if (item.type == typename) {
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
          <Text style={styles.itemInfoName}>{item.name} - {nameLocationMap[item.name]} miles away</Text>
          </View>
        </TouchableHighlight>
      )
    }
  }

  render() {
    const { type } = this.props.navigation.state.params;
    const { loading, apiResponse } = this.state;
    const spin = this.animatedIcon.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const AddItemRoutes = StackNavigator({
      AddItem: { screen: AddItem },
      UploadPhoto: { screen: UploadPhoto },
    });

        return (
      <View style={[{ flex: 1 }]}>
        {!loading && <View style={{ position: 'absolute', bottom: 25, right: 25, zIndex: 1 }}>
        </View>}
        <ScrollView style={[{ flex: 1, zIndex: 0 }]} contentContainerStyle={[loading && { justifyContent: 'center', alignItems: 'center' }]}>
          {loading && <Animated.View style={{ transform: [{ rotate: spin }] }}><Icon name='autorenew' color={colors.grayIcon} /></Animated.View>}
          {
            !loading &&
            <View style={styles.container}>
              <Text style={styles.title}>Available Items</Text>
              {
                apiResponse.map((item, index) => this.renderItem(item, index, type.type))
              }
            </View>
          }
        </ScrollView>
      </View >
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



const ViewItemsRouteStack = {
  ViewItems: {
    screen: (props) => {
      const { screenProps, ...otherProps } = props;
      return <ViewItems {...props.screenProps} {...otherProps} />
    },
    navigationOptions: (props) => {
      return {
        title: 'ViewItems',
        headerLeft: <SideMenuIcon onPress={() => props.screenProps.rootNavigator.navigate('DrawerOpen')} />,
      }
    }
  },
  ViewItemBuy: { screen: ViewItemBuy }
};

const ViewItemsNav = StackNavigator(ViewItemsRouteStack);

// export default (props) => {
//   const { screenProps, rootNavigator, ...otherProps } = props;

//   return <ViewItemsNav screenProps={{ rootNavigator, ...screenProps, ...otherProps }} />
// };

export default ViewItems;
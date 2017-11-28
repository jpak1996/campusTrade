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
  TouchableHighlight,
  Modal,
} from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { DrawerNavigator, NavigationActions, StackNavigator } from 'react-navigation';

import Auth from '../../lib/Categories/Auth';
import Storage from '../../lib/Categories/Storage';
import API from '../../lib/Categories/API';
import AddItem from './AddItem';
import ViewItem from './ViewItem';
import UploadPhoto from '../Components/UploadPhoto';
import SideMenuIcon from '../Components/SideMenuIcon';
import awsmobile from '../../aws-exports';
import { colors } from 'theme';

let styles = {};

class Sell extends React.Component {
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

    return (
      <TouchableHighlight
        onPress={() => {
          this.props.navigation.navigate('ViewItem', { item })
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
        <Text style={styles.itemInfoName}>{item.name}</Text>
        </View>
      </TouchableHighlight>
    )
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

    return (
      <View style={[{ flex: 1 }]}>
        {!loading && <View style={{ position: 'absolute', bottom: 25, right: 25, zIndex: 1 }}>
          <Icon
            onPress={this.toggleModal}
            raised
            reverse
            name='add'
            size={44}
            containerStyle={{ width: 50, height: 50 }}
            color={colors.primary}
          />
        </View>}
        <ScrollView style={[{ flex: 1, zIndex: 0 }]} contentContainerStyle={[loading && { justifyContent: 'center', alignItems: 'center' }]}>
          {loading && <Animated.View style={{ transform: [{ rotate: spin }] }}><Icon name='autorenew' color={colors.grayIcon} /></Animated.View>}
          {
            !loading &&
            <View style={styles.container}>
              <Text style={styles.title}>My Items</Text>
              {
                apiResponse.map((item, index) => this.renderItem(item, index))
              }
            </View>
          }
        </ScrollView>
        <Modal
          animationType={"slide"}
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={this.toggleModal}
        >
          <AddItemRoutes screenProps={{ handleRetrieveItem: this.handleRetrieveItem, toggleModal: this.toggleModal }} />
        </Modal>
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



const SellRouteStack = {
  Sell: {
    screen: (props) => {
      const { screenProps, ...otherProps } = props;
      return <Sell {...props.screenProps} {...otherProps} />
    },
    navigationOptions: (props) => {
      return {
        title: 'Sell',
        headerLeft: <SideMenuIcon onPress={() => props.screenProps.rootNavigator.navigate('DrawerOpen')} />,
      }
    }
  },
  ViewItem: { screen: ViewItem }
};

const SellNav = StackNavigator(SellRouteStack);

export default (props) => {
  const { screenProps, rootNavigator, ...otherProps } = props;

  return <SellNav screenProps={{ rootNavigator, ...screenProps, ...otherProps }} />
};

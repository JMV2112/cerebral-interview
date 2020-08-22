/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { hideNavigationBar } from 'react-native-navigation-bar-color'

import HomeScreen from './src/screens/home'
import QuestionnaireScreen from './src/screens/questionnaire'
import AnswersScreen from './src/screens/answers'

export type RootStackParamList = {
  Home: undefined
  Questionnaire: undefined,
  Answers: undefined
}

const RootStack = createStackNavigator<RootStackParamList>()

const App: () => React$Node = () => {

  hideNavigationBar()

  return (
    <NavigationContainer>
      <RootStack.Navigator>
        <RootStack.Screen name='Home' component={HomeScreen} options={{ title: 'Welcome' }}/>
        <RootStack.Screen name="Questionnaire" component={QuestionnaireScreen} />
        <RootStack.Screen name="Answers" component={AnswersScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};


export default App

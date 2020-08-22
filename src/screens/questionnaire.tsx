import React, {FunctionComponent, useState, useEffect, useRef} from 'react'
import {StyleSheet, Dimensions, Keyboard, ScrollView, View, Text, Image, TextInput, TouchableOpacity, Alert} from 'react-native'
import axios from 'axios'
import { StackNavigationProp } from '@react-navigation/stack'
import AsyncStorage from '@react-native-community/async-storage'

import { RootStackParamList } from '../../App'
import { KEYS } from '../constants'

type QustionnaireScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Questionnaire'>

export type Question = {
    id: number,
    question: string,
    style?: string,
    validation: Array<string> | string | boolean,
    paths?: Object | number
}

const doctorsName = 'Jane Doe'

const QuestionnaireScreen:FunctionComponent<{navigation: QustionnaireScreenNavigationProp}> = ({navigation}) => {
    const [questionnaireData, setQuestionnaireData] = useState([] as Question[])
    const [questionsAndResponses, setQuestionsAndResponses] = useState<any[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [requestError, setRequestError] = useState<string | undefined>(undefined)
    const [windowHeight, setWindowHeight] = useState(Dimensions.get('window').height - 50)
    const [textInputValue, onChangeInputText] = useState('')
    const textInput = useRef(null)

    useEffect(() => {
        axios.get('https://gist.githubusercontent.com/pcperini/97fe41fc42ac1c610548cbfebb0a4b88/raw/cc07f09753ad8fefb308f5adae15bf82c7fffb72/cerebral_challenge.json')
            .then(res => {
                if (Array.isArray(res.data) && res.data.length) {
                    console.log('DATA: ', res.data)
                    
                    setQuestionnaireData(res.data)
                    setRequestError(undefined)
                    setCurrentQuestionIndex(1)
                    setQuestionsAndResponses([])
                } else {
                    setRequestError('Empty Response')
                }
            })
            .catch(err => {
                console.log('Request for onboarding questionnaireData error: ', err)
                setRequestError(err)
            })
    }, [])

    useEffect(() => {
        if (questionnaireData.length) {
            // setCurrentQuestionIndex(currentQuestionIndex + 1)
            _getNextQuestion()
        }
    }, [questionnaireData])

    useEffect(() => {
        _getNextQuestion()
    }, [questionsAndResponses])

    useEffect(() => {
        Keyboard.addListener("keyboardDidShow", _keyboardDidShow)
        Keyboard.addListener("keyboardDidHide", _keyboardDidHide)
    
        return () => {
          Keyboard.removeListener("keyboardDidShow", _keyboardDidShow)
          Keyboard.removeListener("keyboardDidHide", _keyboardDidHide)
        }
    }, [])
    
    const _keyboardDidShow = (e) => {
        setWindowHeight(Dimensions.get('window').height - e.endCoordinates.height - 50)
    }
    
    const _keyboardDidHide = (e) => {
        setWindowHeight(Dimensions.get('window').height - 50)
    }

    const _validateResponse = () => {
        if (textInput.current) {
            textInput.current.clear()
        }

        const response = textInputValue

        const validationRules = questionnaireData[currentQuestionIndex - 1].validation

        if (Array.isArray(validationRules)) {
            const result = validationRules.find(rule => rule.toLowerCase() === response.toLowerCase())
            
            if (result) {
                return true
            }

            return false
        }
        else if (typeof validationRules === 'string') {
            const re = new RegExp(validationRules)
            
            return re.test(response)
        }
        else if (typeof validationRules === 'boolean') {
            return validationRules
        }

        return false
    }

    const _getNextQuestion = () => {
        const currentQuestion = questionnaireData[currentQuestionIndex]

        console.log('CURRENT QUESTION: ', currentQuestion)
        console.log('CURRENT QUESTION INDEX: ', currentQuestionIndex)

        if (currentQuestion) {
            if (currentQuestion.id === 1) {
                questionsAndResponses.push(currentQuestion)

                setQuestionsAndResponses(questionsAndResponses)
                setCurrentQuestionIndex(currentQuestionIndex + 1)
            }
            else if (currentQuestion.hasOwnProperty('paths')) {
                console.log('PATHS: ', currentQuestion.paths)
                if (typeof currentQuestion.paths === 'number') {
                    questionsAndResponses.push(currentQuestion)

                    setQuestionsAndResponses(questionsAndResponses)
                    setCurrentQuestionIndex(currentQuestion.paths)
                }
                else if (typeof currentQuestion.paths === 'object') {
                    console.log('TEXT INPUT VALUE: ', textInputValue)
                    const keys = Object.keys(currentQuestion.paths)
                    const pathKey = keys.find(key => key.toLowerCase() === textInputValue.toLowerCase())

                    console.log('KEY: ', currentQuestion.paths[pathKey])

                    if (pathKey && currentQuestion.paths[pathKey] !== -1) {
                        questionsAndResponses.push(currentQuestion)

                        setQuestionsAndResponses(questionsAndResponses)
                        setCurrentQuestionIndex(currentQuestion.paths[pathKey])
                    } else {
                        setQuestionsAndResponses([questionnaireData[0]])
                        setCurrentQuestionIndex(0)

                        setTimeout(() => {
                            navigation.pop()
                        }, 3000)
                    }
                }
            } 
            else if (currentQuestion.id === questionnaireData.length - 1) {
                console.log('SAVING LAST QUESTION')
                questionsAndResponses.push(currentQuestion)
                setQuestionsAndResponses(questionsAndResponses)

                _saveResults()
            }
        }

        console.log('QUESTIONS: ', questionsAndResponses)
    }

    const _printResponse = () => {
        if (_validateResponse()) {
            questionsAndResponses.push(textInputValue)
            setQuestionsAndResponses(questionsAndResponses)
            _getNextQuestion()
        } else {
            const currentQuestion = questionnaireData[currentQuestionIndex - 1]
            const alertTitle = 'Error'

            if (Array.isArray(currentQuestion.validation)) {
                Alert.alert(alertTitle, `Response must be one of the following options: ${currentQuestion.validation}`)
            } 
            else if (currentQuestion.question.includes('email')) {
                Alert.alert(alertTitle, 'Reponse must be in email format.')
            }
            else if (currentQuestion.question.includes('password')) {
                const minimumCharacters = (currentQuestion.validation as string).charAt(2)
                Alert.alert(alertTitle, `Password must be at least ${minimumCharacters} characters.`)
            }
            else if (currentQuestion.question.includes('mm/dd/yyyy')) {
                Alert.alert(alertTitle, 'Date must be in mm/dd/yyyy format.')
            }
            else if (typeof currentQuestion.validation === 'boolean' && currentQuestion.validation) {
                Alert.alert(alertTitle, 'Input is required.')
            }
        }
    }

    const _saveResults = async() => {
        try {
            await AsyncStorage.setItem(KEYS.hasCompletedQuestionnaire, 'true')
            console.log('SAVING questionsAndResponses: ', JSON.stringify(questionsAndResponses))
            await AsyncStorage.setItem(KEYS.questionnaire, JSON.stringify(questionsAndResponses))

            console.log('RESULTS SAVED')
        }
        catch (err) {
            console.log('ERROR SAVING RESULTS')
        }

        setTimeout(() => {
            navigation.pop()
        }, 3000)
    }

    return(
        <View style={styles({windowHeight}).container}>
            <View style={styles({}).header}>
                <Image source={require('../images/profile-image.png')} style={styles({}).profileIcon} />
                <Text style={styles({}).profileName}>{doctorsName}</Text>
            </View>
            <View style={styles({}).body}>
                {
                    requestError ? (
                        <View style={styles({}).errorWrapper}>
                            <Text style={styles({}).errorMessage}>Sorry, our services are currently down. Please try again later.</Text>
                        </View>
                    ) : (
                        <ScrollView>
                            {
                                questionsAndResponses.length ? questionsAndResponses.map((questionOrResponse, index) => {
                                    const key = typeof questionOrResponse === 'string' ? `${index}-${questionOrResponse}` : (questionOrResponse as Question).id
                                    const isResponse = typeof questionOrResponse === 'string'
                                    const textContent = isResponse ? questionOrResponse : (questionOrResponse as Question).question

                                    return(
                                        <View key={key} style={styles({}).questionResponseWrapper}>
                                            <Text style={isResponse ? styles({}).usersName : styles({}).doctorsName}>{isResponse ? 'You:' : `${doctorsName}:`}</Text>
                                            <Text style={styles({}).response}>{textContent}</Text>
                                        </View>
                                    )
                                }) : null
                            }
                        </ScrollView>
                    )
                }
            </View>
            <View style={styles({}).footer}>
                <TextInput 
                    ref={textInput}
                    value={textInputValue} 
                    placeholder='Type here...'
                    onChangeText={text => onChangeInputText(text)}
                    style={styles({}).textInput}/>
                <TouchableOpacity onPress={() => _printResponse()} style={styles({}).sendMessageButton}>
                    <Image source={require('../images/send-message.png')} style={styles({}).sendMessageIcon}/>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = ({ windowHeight } : { windowHeight?: number }) => StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        height: windowHeight ? windowHeight : Dimensions.get('window').height
    },
    header: {
        backgroundColor: '#ECF5F7',
        height: 75,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 20
    },
    profileIcon: {
        width: 45,
        height: 45,
        borderRadius: 45/2,
        marginRight: 20
    },
    profileName: {
        color: '#6B7C90',
        fontSize: 16,
        fontWeight: 'bold'
    },
    body: {
        backgroundColor: '#FFFFFF',
        marginLeft: 30,
        marginRight: 30,
        marginTop: 30,
        marginBottom: 30,
        height: Dimensions.get('window').height - (64 + 75 + 60 + 160)
    },
    footer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 160,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 30,
        paddingBottom: 30,
        backgroundColor: '#ECF5F7',
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0
    },
    textInput: {
        backgroundColor: '#FFFFFF',
        borderColor: '#D9E6E9',
        borderWidth: 1,
        borderRadius: 2,
        padding: 10,
        height: 100,
        width: Dimensions.get('window').width - 40 - 125 - 10,
        textAlignVertical: 'top'
    },
    sendMessageButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5093FE',
        height: 100,
        width: 125,
        borderRadius: 2
    },
    sendMessageIcon: {
        width: 45,
        height: 40
    },
    errorWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300
    },
    errorMessage: {
        fontWeight: 'bold',
        fontSize: 16
    },
    messageWrapper: {
        display: 'flex',
        flexDirection: 'column'
    },
    doctorsName: {
        color: '#6B7C90',
        fontSize: 16,
        fontWeight: 'bold'
    },
    usersName: {
        color: '#79ABFE',
        fontSize: 16,
        fontWeight: 'bold'
    },
    questionResponseWrapper: {
        marginTop: 10,
        marginBottom: 10
    },
    response: {
        color: '#D0D1D3',
        fontSize: 14
    }
})

export default QuestionnaireScreen

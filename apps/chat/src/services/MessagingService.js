/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import {
  LogLevel,
  ConsoleLogger,
  DefaultMessagingSession,
  MessagingSessionConfiguration
} from 'amazon-chime-sdk-js';

import { getMessagingSessionEndpoint, createMemberArn } from '../api/ChimeAPI';

class MessagingService {
  constructor() {
    this._session;
    this.sessionId = uuid();
    this._logger = new ConsoleLogger('SDK Chat Demo', LogLevel.INFO);
    this._messageUpdateCallbacks = [];
  }

  // 型はamazon-chime-sdk-js.MessagingSessionObserver
  messageObserver = {
    messagingSessionDidStart: () => {
      console.log('Messaging Connection started!');
    },
    messagingSessionDidStartConnecting: reconnecting => {
      console.log('Messaging Connection connecting');
    },
    messagingSessionDidStop: event => {
      console.log('Messaging Connection received DidStop event');
    },
    // messageを受け取った時にcallbackを走らせる
    // message周りの型定義などはないのか？
    /*
      amazon-chime-sdk-js.MessagingSessionObserverのmessagingSessionDidReceiveMessageで引数としてもらってきている
      ./node_modules/amazon-chime-sdk-js/build/message/Message.d.ts
      export default class Message {
        readonly type: string;
        readonly headers: any;
        readonly payload: string;
        constructor(type: string, // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
        headers: any, payload: string);
      }
      payloadはjson形式のstringで格納しているっぽい。なんでパースしないのか？
      ./node_modules/amazon-chime-sdk-js/build/messagingsession/DefaultMessagingSession.js
      receiveMessageHandler(data)で、messageを作成している
      json型のHeader情報はjsonData.Headers['x-amz-chime-event-type']に入っていそう？
    */
    messagingSessionDidReceiveMessage: message => {
      console.log('Messaging Connection received message');
      this.publishMessageUpdate(message);
    }
  };

  // memberごとにsessionはるの？ 特定のchannelのみのmessageのevent処理などはできない？
  /*
    callbackのほうで制御している。 
    いずれにせよ見ていないchannelに対しても、未読フラグを立たせないといけない。
    だからすべてlistenしている。
  */
  setMessagingEndpoint(member) {
    getMessagingSessionEndpoint()
      .then(async response => {
        this._endpoint = response?.Endpoint?.Url;

        const sessionConfig = new MessagingSessionConfiguration(
          createMemberArn(member.userId),
          this.sessionId,
          this._endpoint,
          new AWS.Chime(),
          AWS
        );

        this._session = new DefaultMessagingSession(
          sessionConfig,
          this._logger
        );

        // addObserverで、各イベントのCallbackを設定している？
        // →あっている。 this.messageObsererはaws-chime-sdk.jsで決められたevent処理
        this._session.addObserver(this.messageObserver);
        /*
          ./node_modules/amazon-chime-sdk-js/build/messagingsession/DefaultMessagingSession.js
          startConnecting()でwebSocketのコネクションを確立
          forEachObserverが走っていて、最終的にはmessagingSessionDidStartConnecting()を走らせている
        */
        this._session.start();
      })
      .catch(err => {
        console.error(err);
      });
  }

  connect(member) {
    this.setMessagingEndpoint(member);
  }

  close() {
    try {
      this._session.stop();
    } catch (err) {
      console.error('Failed to stop Messaging Session.');
    }
  }

  subscribeToMessageUpdate(callback) {
    console.log('Message listener subscribed!');
    this._messageUpdateCallbacks.push(callback);
  }

  unsubscribeFromMessageUpdate(callback) {
    const index = this._messageUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      this._messageUpdateCallbacks.splice(index, 1);
    }
  }

  publishMessageUpdate(message) {
    console.log(`Sending message update to listeners!`);
    for (let i = 0; i < this._messageUpdateCallbacks.length; i += 1) {
      const callback = this._messageUpdateCallbacks[i];
      callback(message);
    }
  }
}

export default MessagingService;

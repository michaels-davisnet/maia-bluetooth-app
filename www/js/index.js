// (c) 2014 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global mainPage, deviceList, refreshButton */
/* global detailPage, resultDiv, messageInput, sendButton, disconnectButton */
/* global ble, cordova  */
/* jshint browser: true , devel: true*/


'use strict'; // need to be included for ble write

// Based on the serialLab example.

// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

// Converts a string to array buffer
function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

var serial = {
    serviceUUID: "0000DA00-384C-0787-5024-F95B53F8CB75",
    rxCharacteristic: "0000DA01-384C-0787-5024-F95B53F8CB75"  // receive is from the phone's perspective
};

var cmd = {
	serviceUUID: "0000DA10-384C-0787-5024-F95B53F8CB75",
	txCharacteristic: "0000DA11-384C-0787-5024-F95B53F8CB75" // transmit is from the phone's perspective
};

var fwup = {
	serviceUUID: "0000DA12-384C-0787-5024-F95B53F8CB75",
	txCharacteristic: "0000DA13-384C-0787-5024-F95B53F8CB75" // transmit is from the phone's perspective
};


var app = {
	initialize: function() {
        this.bindEvents();
        detailPage.hidden = true;
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
        sendButton.addEventListener('click', this.sendData, false);
		transferButton.addEventListener('touchstart', this.dataTransfer, false);
        disconnectButton.addEventListener('touchstart', this.disconnect, false);
		fwupInstallButton.addEventListener('touchstart', this.readFirmware, false);
		fwupDownloadButton.addEventListener('touchstart', this.getFirmware, false);
        deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
    },
    onDeviceReady: function() {
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empties the list
        if (cordova.platformId === 'android') { // Android filtering is broken
            ble.scan([], 5, app.onDiscoverDevice, app.onError);
        } else {
            ble.scan([cmd.serviceUUID], 5, app.onDiscoverDevice, app.onError);
        }
    },
    onDiscoverDevice: function(device) {
        var listItem = document.createElement('li'),
            html = '<b>' + device.name + '</b><br/>' +
                'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
                device.id;

        listItem.dataset.deviceId = device.id;
        listItem.innerHTML = html;
        deviceList.appendChild(listItem);
    },
    connect: function(e) {
        var deviceId = e.target.dataset.deviceId,
		onConnect = function() {
			// subscribe for incoming data
			ble.notify(deviceId, serial.serviceUUID, serial.rxCharacteristic, app.onData, app.onError);
			sendButton.dataset.deviceId = deviceId;
			transferButton.dataset.deviceId = deviceId;
			disconnectButton.dataset.deviceId = deviceId;
			app.showDetailPage();
		};

        ble.connect(deviceId, onConnect, app.onError);
    },
    onData: function(data) { // data received from bluetooth preformatted ascii encoded.
        //console.log(data);
        resultDiv.innerHTML += bytesToString(data);
        resultDiv.scrollTop = resultDiv.scrollHeight;
    },
    sendData: function(event) { // send data to bluetooth

        var success = function() {
            console.log("success");
            //resultDiv.innerHTML = resultDiv.innerHTML + "Sent: " + messageInput.value + "<br/>";
            resultDiv.scrollTop = resultDiv.scrollHeight;
        };

        var failure = function() {
            alert("Failed writing data to 0000DA11");
        };

        var data = stringToBytes(messageInput.value);
        var deviceId = event.target.dataset.deviceId;
        ble.writeWithoutResponse(deviceId, cmd.serviceUUID, cmd.txCharacteristic, data, success, failure);

    },
    dataTransfer: function(event, buffer) { // send data to bluetooth
		var count = 5000;
        var success = function() {
			count--;
			if (count > 0) {
				ble.writeWithoutResponse(deviceId, fwup.serviceUUID, fwup.txCharacteristic, data, success, failure);
			}
			else {
				alert("finished");
			}
        };
        var failure = function() {
            alert("Failed writing data to 0000DA13");
        };
		
        var data = stringToBytes('12345678901234567890');
        var deviceId = event.target.dataset.deviceId;
        ble.writeWithoutResponse(deviceId, fwup.serviceUUID, fwup.txCharacteristic, data, success, failure);
    },
    disconnect: function(event) {
        var deviceId = event.target.dataset.deviceId;
        ble.disconnect(deviceId, app.showMainPage, app.onError);
    },
	getFirmware: function() {
		var fileTransfer = new FileTransfer();
		var uri = encodeURI("http://maiadev.weatherlink.com/firmware/fwup.bin");
		//var uri = encodeURI("http://10.94.24.50/firmware/fwup.bin");
		var fileURL = "cdvfile://localhost/persistent/fwup.bin";
		
		fileTransfer.download(
			uri,
			fileURL,
			function(entry) {
				alert("download complete: " + entry.toURL());
			},
			function(error) {
				alert("download error source " + error.source);
				alert("download error target " + error.target);
				alert("upload error code" + error.code);
			},
			true
		);
		
	},
	readFirmware: function() {
		var myfileURL = "cdvfile://localhost/persistent/fwup.bin";
		var fail = function(e) {
			alert("resolveLocalFileSystemURL " + e.toString());
		};
		window.resolveLocalFileSystemURL(myfileURL, app.gotFile, fail);
	},
	gotFile: function(fileEntry) {
		var fail = function(e) {
			alert("fileEntry.file err_cb " + e.toString());
		};
		var success = function(file) {
			alert(".file success");
			var reader = new FileReader();
			reader.onloadend = function(e) { // this is needed? Called when reading file is completed.
				var txtArea = document.createElement('textarea');
				var byteView = new Uint8Array(this.result, 0 , 9); //this.result is the array buffer.
				txtArea.value = bytesToString(byteView);
				//txtArea.value = this.result;
				document.body.appendChild(txtArea);
			};
			reader.readAsArrayBuffer(file);
			//reader.readAsArrayBuffer(file);
			//alert("OK! " + reader.result[4]);
		};
		fileEntry.file(success, fail);
		alert("got file");
	},
    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
    },
    showDetailPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = false;
    },
    onError: function(reason) {
        alert("ERROR: " + reason); // real apps should use notification.alert
    }
};
/*jslint bitwise: true, browser: true, white: true, nomen: true*/
/*global IDENTIFIERAPI*/
/**
 * Gamezyme namespace
 * @module Gamezyme
 */
var Gamezyme = (function() {
    'use strict';
    var gz = {},
        APIURL = "http://api.gamezyme.com/",
        BACKENDWEBURL = "http://www.gamezyme.com/",
        PUBLICKEY,
        GAMEID,
        VERSION,
        IDENTIFIERAPI,
        ERRORS = {
            "1": "General error, this typically means the player is unable to connect to the server",
            "2": "Invalid game credentials, make sure you use the right public key",
            "3": "Request timed out",
            "4": "Invalid request",
            "100": "Entered email is not valid email address",
            "101": "Not found parameters 'user' or 'token' in function 'registerCredential'",
            "102": "Parameter 'typeIdentifier' allowed only value [local-signup, facebook, twitter, googlePlus]"
        },
        loginCallback,
        errorCallback,
        gamesageLoginWindow,
        loginWindowTimer,
        gamesageLoginWindowsFinish = false,
        loginWindowClosed = true,
        AuthenticationFactory = {
            isLogged: false,
            user: undefined,
            token: undefined,
            type: undefined
        },
        Encode = (function() {
            var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                hex_chr = "0123456789abcdef",
                enc = {};

            function _utf8_encode(string) {
                var n,
                    c,
                    utftext = "";

                if (!string) {
                    return utftext;
                }

                string = string.replace(/\r\n/g, "\n");

                for (n = 0; n < string.length; n += 1) {
                    c = string.charCodeAt(n);

                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    } else if ((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    } else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                }

                return utftext;
            }

            function bitOR(a, b) {
                var lsb = (a & 0x1) | (b & 0x1),
                    msb31 = (a >>> 1) | (b >>> 1);

                return (msb31 << 1) | lsb;
            }

            function bitXOR(a, b) {
                var lsb = (a & 0x1) ^ (b & 0x1),
                    msb31 = (a >>> 1) ^ (b >>> 1);

                return (msb31 << 1) | lsb;
            }

            function bitAND(a, b) {
                var lsb = (a & 0x1) & (b & 0x1),
                    msb31 = (a >>> 1) & (b >>> 1);

                return (msb31 << 1) | lsb;
            }

            function addme(x, y) {
                var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                    msw = (x >> 16) + (y >> 16) + (lsw >> 16);

                return (msw << 16) | (lsw & 0xFFFF);
            }

            function rhex(num) {
                var str = "",
                    j;

                for (j = 0; j <= 3; j += 1) {
                    str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) + hex_chr.charAt((num >> (j * 8)) & 0x0F);
                }

                return str;
            }

            function str2blks_MD5(str) {
                var nblk = ((str.length + 8) >> 6) + 1,
                    blks = [],
                    l = str.length * 8,
                    i;

                for (i = 0; i < nblk * 16; i += 1) {
                    blks.push(0);
                }

                for (i = 0; i < str.length; i += 1) {
                    blks[i >> 2] |= str.charCodeAt(i) << (((str.length * 8 + i) % 4) * 8);
                }

                blks[i >> 2] |= 0x80 << (((str.length * 8 + i) % 4) * 8);

                blks[nblk * 16 - 2] = (l & 0xFF);
                blks[nblk * 16 - 2] |= ((l >>> 8) & 0xFF) << 8;
                blks[nblk * 16 - 2] |= ((l >>> 16) & 0xFF) << 16;
                blks[nblk * 16 - 2] |= ((l >>> 24) & 0xFF) << 24;

                return blks;
            }

            function rol(num, cnt) {
                return (num << cnt) | (num >>> (32 - cnt));
            }

            function cmn(q, a, b, x, s, t) {
                return addme(rol((addme(addme(a, q), addme(x, t))), s), b);
            }

            function ff(a, b, c, d, x, s, t) {
                return cmn(bitOR(bitAND(b, c), bitAND((~b), d)), a, b, x, s, t);
            }

            function gg(a, b, c, d, x, s, t) {
                return cmn(bitOR(bitAND(b, d), bitAND(c, (~d))), a, b, x, s, t);
            }

            function hh(a, b, c, d, x, s, t) {
                return cmn(bitXOR(bitXOR(b, c), d), a, b, x, s, t);
            }

            function ii(a, b, c, d, x, s, t) {
                return cmn(bitXOR(c, bitOR(b, (~d))), a, b, x, s, t);
            }

            enc.base64 = function(str) {
                var output = "",
                    chr1,
                    chr2,
                    chr3,
                    enc1,
                    enc2,
                    enc3,
                    enc4,
                    i = 0;

                str = _utf8_encode(str);

                while (i < str.length) {
                    chr1 = str.charCodeAt(i);
                    i += 1;
                    chr2 = str.charCodeAt(i);
                    i += 1;
                    chr3 = str.charCodeAt(i);
                    i += 1;
                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
                }

                return output;
            };

            enc.md5 = function(str) {
                var x = str2blks_MD5(str),
                    a = 1732584193,
                    b = -271733879,
                    c = -1732584194,
                    d = 271733878,
                    olda,
                    oldb,
                    oldc,
                    oldd,
                    i;

                for (i = 0; i < x.length; i += 16) {
                    olda = a;
                    oldb = b;
                    oldc = c;
                    oldd = d;

                    a = ff(a, b, c, d, x[i], 7, -680876936);
                    d = ff(d, a, b, c, x[i + 1], 12, -389564586);
                    c = ff(c, d, a, b, x[i + 2], 17, 606105819);
                    b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
                    a = ff(a, b, c, d, x[i + 4], 7, -176418897);
                    d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
                    c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
                    b = ff(b, c, d, a, x[i + 7], 22, -45705983);
                    a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
                    d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
                    c = ff(c, d, a, b, x[i + 10], 17, -42063);
                    b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
                    a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
                    d = ff(d, a, b, c, x[i + 13], 12, -40341101);
                    c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
                    b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
                    a = gg(a, b, c, d, x[i + 1], 5, -165796510);
                    d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
                    c = gg(c, d, a, b, x[i + 11], 14, 643717713);
                    b = gg(b, c, d, a, x[i], 20, -373897302);
                    a = gg(a, b, c, d, x[i + 5], 5, -701558691);
                    d = gg(d, a, b, c, x[i + 10], 9, 38016083);
                    c = gg(c, d, a, b, x[i + 15], 14, -660478335);
                    b = gg(b, c, d, a, x[i + 4], 20, -405537848);
                    a = gg(a, b, c, d, x[i + 9], 5, 568446438);
                    d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
                    c = gg(c, d, a, b, x[i + 3], 14, -187363961);
                    b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
                    a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
                    d = gg(d, a, b, c, x[i + 2], 9, -51403784);
                    c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
                    b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
                    a = hh(a, b, c, d, x[i + 5], 4, -378558);
                    d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
                    c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
                    b = hh(b, c, d, a, x[i + 14], 23, -35309556);
                    a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
                    d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
                    c = hh(c, d, a, b, x[i + 7], 16, -155497632);
                    b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
                    a = hh(a, b, c, d, x[i + 13], 4, 681279174);
                    d = hh(d, a, b, c, x[i], 11, -358537222);
                    c = hh(c, d, a, b, x[i + 3], 16, -722521979);
                    b = hh(b, c, d, a, x[i + 6], 23, 76029189);
                    a = hh(a, b, c, d, x[i + 9], 4, -640364487);
                    d = hh(d, a, b, c, x[i + 12], 11, -421815835);
                    c = hh(c, d, a, b, x[i + 15], 16, 530742520);
                    b = hh(b, c, d, a, x[i + 2], 23, -995338651);
                    a = ii(a, b, c, d, x[i], 6, -198630844);
                    d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
                    c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
                    b = ii(b, c, d, a, x[i + 5], 21, -57434055);
                    a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
                    d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
                    c = ii(c, d, a, b, x[i + 10], 15, -1051523);
                    b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
                    a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
                    d = ii(d, a, b, c, x[i + 15], 10, -30611744);
                    c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
                    b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
                    a = ii(a, b, c, d, x[i + 4], 6, -145523070);
                    d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
                    c = ii(c, d, a, b, x[i + 2], 15, 718787259);
                    b = ii(b, c, d, a, x[i + 9], 21, -343485551);

                    a = addme(a, olda);
                    b = addme(b, oldb);
                    c = addme(c, oldc);
                    d = addme(d, oldd);
                }

                return rhex(a) + rhex(b) + rhex(c) + rhex(d);
            };

            return enc;
        }());

    function localPersistSet(key, value) {
        try {
            if (window.localStorage) {
                var objStorage = JSON.parse(localStorage.getItem(IDENTIFIERAPI) || '{}');
                objStorage[key] = value;
                localStorage.setItem(IDENTIFIERAPI, JSON.stringify(objStorage));
            }
        } catch (e) {
            return;
        }
    }

    function localPersistGet(key) {
        try {
            if (window.localStorage) {
                var objStorage = JSON.parse(localStorage.getItem(IDENTIFIERAPI) || '{}');

                return objStorage[key];
            }
        } catch (e) {
            return;
        }
    }

    AuthenticationFactory.registerCredential = function(user, token, type, rememberMe) {
        if (!user || !token) {
            throw Gamezyme.ERRORS[101];
        }

        AuthenticationFactory.isLogged = true;
        AuthenticationFactory.user = user;
        AuthenticationFactory.token = token;
        AuthenticationFactory.type = type;

        if (rememberMe) {
            localPersistSet("user", user);
            localPersistSet("token", token);
            localPersistSet("type", type);
        }
    };

    AuthenticationFactory.unregisterCredential = function() {
        AuthenticationFactory.isLogged = false;
        AuthenticationFactory.user = undefined;
        AuthenticationFactory.token = undefined;
        AuthenticationFactory.type = undefined;

        localPersistGet("user", null);
        localPersistGet("token", null);
        localPersistGet("type", null);
    };

    AuthenticationFactory.getToken = function() {
        if (!AuthenticationFactory.token) {
            var token = localPersistGet('token');

            if (token === 'null' || token === 'undefined') {
                return undefined;
            }
            return token;
        }
        return AuthenticationFactory.token;
    };

    AuthenticationFactory.getUser = function() {
        if (!AuthenticationFactory.user) {
            return localPersistGet('user');
        }
        return AuthenticationFactory.user;
    };

    AuthenticationFactory.getType = function() {
        if (!AuthenticationFactory.type) {
            var type = localPersistGet('type');

            if (type === 'null' || type === 'undefined') {
                return undefined;
            }
            return type;
        }
        return AuthenticationFactory.type;
    };

    function validateEmailAddress(email) {
        var expr = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (!email || !expr.test(email)) {
            return ERRORS[100];
        }
    }

    function validateStringParameter(parameterName, parameterValue, arrayError) {
        if (!parameterValue || parameterValue.length === 0) {
            arrayError[arrayError.length] = '"' + parameterName + '" parameter required';
            return false;
        }
        return true;
    }

    function validateParameter(parameterName, parameterValue, arrayError) {
        switch (parameterName) {
            case 'email':
                if (validateStringParameter(parameterName, parameterValue, arrayError)) {
                    var checkEmailAddress = validateEmailAddress(parameterValue);
                    if (checkEmailAddress) {
                        arrayError[arrayError.length] = checkEmailAddress;
                    }
                }
                break;
            case 'password':
                validateStringParameter(parameterName, parameterValue, arrayError);
                break;
            case 'name':
                validateStringParameter(parameterName, parameterValue, arrayError);
                break;
            default:
                throw 'parameter does not exist';
        }
    }

    function validateArrayError(arrayError) {
        if (arrayError.length > 0) {
            throw 'ERROR(s): ' + arrayError;
        }
    }

    // function verifyClosedPopupFacebookLogin() {
    //     if (gamesageLoginWindow.closed) {
    //         loginWindowClosed = true;
    //         clearInterval(loginWindowTimer);
    //
    //         if (gamesageLoginWindowsFinish) {
    //             window.GamezymeAsyncInit();
    //         } else {
    //             window.alert('error: autenticacion fallida, volver a intentar');
    //         }
    //     }
    // }
    function Response(success, errorcode) {
        return {
            success: success,
            errorcode: errorcode,
            errormessage: undefined //ERRORS[errorcode]
        };
    }

    function sendAPIRequest(section, action, complete, callback, postdata) {
        var json = {},
            pda = {},
            request;

        postdata = postdata || {};
        postdata.section = section;
        postdata.action = action;
        postdata.identifierGame = GAMEID;
        postdata.version = VERSION;

        if (window.XMLHttpRequest) {
            request = new window.XMLHttpRequest();
        } else {
            request = new window.ActiveXObject("Microsoft.XMLHTTP");
        }

        if (AuthenticationFactory.getToken()) {
            postdata.token = AuthenticationFactory.getToken();
        }

        if (AuthenticationFactory.getUser()) {
            postdata.identifierPlayer = AuthenticationFactory.getUser();
        }

        json = JSON.stringify(postdata);
        pda.data = Encode.base64(json);
        pda.hash = Encode.md5(json + 'privatekey');

        request.open("POST", APIURL, true);
        request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        request.onreadystatechange = function() {
            var result;

            if (request.readyState === 4) {
                if (request.status === 200) {
                    result = JSON.parse(request.responseText);
                    complete(callback, postdata, result, new Response(result.status, result.error));
                } else if (request.status === 400) {
                    result = {
                        status: 'fail',
                        error: {
                            code: 0,
                            message: ERRORS[1]
                        }
                    };
                    complete(callback, postdata, result, new Response(false, result.error.message));
                }
            }
        };

        request.send(JSON.stringify(pda));
    }

    function getStateAuth(callback) {
        if (!callback) {
            throw 'Method getStateAuth: Not exists callback';
        }

        sendAPIRequest("players", "verifyToken",
            function(callback, postdata, data, response) {
                callback(data);
            },

            function(resultMe) {
                var result = {
                        status: "success",
                        response: {}
                    },
                    auth = {};

                result.response = auth;

                auth.state = 'disconnected';
                auth.type = undefined;

                if (!resultMe.error) {
                    if (AuthenticationFactory.getToken() && AuthenticationFactory.getType()) {
                        auth.state = 'connected';
                        auth.type = AuthenticationFactory.getType();
                    }
                }

                callback(result);
            },

            undefined);
    }

    function socialLogin(identifier, token, type, rememberMe, callback) {
        AuthenticationFactory.unregisterCredential();

        var result = {},
            remember = rememberMe || false;

        AuthenticationFactory.registerCredential(identifier, token, type, remember);

        if (callback === undefined) {
            return;
        }

        getStateAuth(callback);
    }

    function sendError(error) {
        sendAPIRequest("healths", "receivedError",
            function(callback, postdata, data, response) {
                window.console.log("sendError result:" + data.status);
            }, undefined, {
                error: error
            });
    }

    function facebookLogin(result) {
        if (result.status === 'success') {
            var credentials = result.response;
            socialLogin(credentials.identifier, credentials.token, 'facebook', true, function(result) {
                if (result.status === 'success') {
                    //window.console.log(JSON.stringify(result));
                    //verifyClosedPopupFacebookLogin();
                    if (loginCallback) {
                        loginCallback(result);
                    }
                } else {
                    window.console.log(JSON.stringify(result));
                }
            });
        } else {
            if (result.status === 'critical') {
                sendError(result.error);
            }

            if (errorCallback !== 'undefined') {
                errorCallback(result);
            } else {
                window.console.log('It is recommended to assign a function error callback');
                window.alert('Error!!! ' + JSON.stringify(result.error));
            }
        }
    }

    function processDataFromPopupLogin(result) {
        facebookLogin(result);
    }

    function onTimerCallbackToCheckLoginWindowClosure() {
        if (gamesageLoginWindow) {
            if (gamesageLoginWindow.closed) {
                loginWindowClosed = true;
                clearInterval(loginWindowTimer);
            }
            if (!gamesageLoginWindowsFinish) {
                try {
                    var query;
                    //Es para las URLs utilizadas para mostrar el wait y que SI provienen desde el mismo dominio
                    query = gamesageLoginWindow.location.href.split('#/response=');
                    if (query.length > 1) {
                        gamesageLoginWindow.close();
                        gamesageLoginWindowsFinish = true;
                        processDataFromPopupLogin(JSON.parse(decodeURIComponent(query[1])));
                    }
                } catch (e) {
                    //este error se produce por cross-domain, debemos forzar utilizando postMessage
                    //Es para las URLs utilizadas para mostrar el wait y que NO provienen desde el mismo dominio
                    if (gamesageLoginWindow) {
                        gamesageLoginWindow.postMessage("hello there!", BACKENDWEBURL);
                    }
                    //gamesageLoginWindowsFinish = false;
                }
            }

            //verifyClosedPopupFacebookLogin();
        } else {
            loginWindowClosed = true;
        }
    }

    function receiveMessageFromPopupLogin(event) {
        //url gamesage web
        if (event.origin !== BACKENDWEBURL) {
            return;
        }

        //respuesta de login proveniente desde el popup
        if (!gamesageLoginWindowsFinish) {
            loginWindowClosed = true;
            clearInterval(loginWindowTimer);
            gamesageLoginWindowsFinish = true;
            window.console.log("se recibio respuesta desde popup: " + event.data);
            processDataFromPopupLogin(JSON.parse(decodeURIComponent(event.data)));
        }
    }

    if (window.addEventListener) {
        window.addEventListener("message", receiveMessageFromPopupLogin, false);
    } else {
        window.attachEvent("message", receiveMessageFromPopupLogin);
    }

    function localSignUpComplete(callback, postdata, data, response) {
        if (callback === undefined) {
            return;
        }
        callback(data);
    }

    function localLoginComplete(callback, postdata, data, response) {
        var result = {},
            rememberMe = false;
        if (postdata.rememberMe && postdata.rememberMe === true) {
            rememberMe = true;
        }
        if (data.status === 'success') {
            AuthenticationFactory.registerCredential(postdata.email, data.response, rememberMe);
        } else {
            AuthenticationFactory.unregisterCredential();
            result.error = data.error;
        }

        if (callback === undefined) {
            return;
        }
        result.status = data.status;
        result.response = AuthenticationFactory.isLogged;

        callback(result);
    }

    // function loginOrCreateComplete(callback, postdata, data, response) {
    //     var result = {},
    //         rememberMe = false;
    //     if (postdata.rememberMe && postdata.rememberMe === true) {
    //         rememberMe = true;
    //     }
    //     if (data.status === 'success') {
    //         AuthenticationFactory.registerCredential(postdata.identifier, data.response.token, rememberMe);
    //     } else {
    //         AuthenticationFactory.unregisterCredential();
    //         result.error = data.error;
    //     }
    //
    //     if (callback === undefined) {
    //         return;
    //     }
    //     result.status = data.status;
    //     result.response = AuthenticationFactory.isLogged;
    //
    //     callback(result);
    // }

    // function socialLogin(params, callback) {
    //     AuthenticationFactory.unregisterCredential();
    //
    //     var result = {};
    //     var rememberMe = rememberMe ? rememberMe : false;
    //
    //     AuthenticationFactory.registerCredential(identifier, token, type, rememberMe);
    //
    //     if (typeof callback === 'undefined')
    //         return;
    //
    //     result.status = 'success';
    //     result.response = AuthenticationFactory.isLogged;
    //
    //     callback(result);
    // }


    function getOrSaveDataComplete(callback, postdata, data, response) {
        if (callback === undefined) {
            return;
        }

        if (data.response === undefined) {
            data.response = JSON.stringify({});
        }

        callback(data, response);
    }

    function logoutComplete(callback, postdata, data, response) {
        AuthenticationFactory.unregisterCredential();

        if (callback === undefined) {
            return;
        }
        callback({
            status: 'success',
            response: AuthenticationFactory.isLogged
        });
    }

    function forgotPasswordComplete(callback, postdata, data, response) {
        if (callback === undefined) {
            return;
        }
        callback(data);
    }

    function meComplete(callback, postdata, data, response) {
        if (callback === undefined) {
            return;
        }

        callback(data);
    }

    function loadComplete(callback, postdata, data, response) {
        if (callback === undefined) {
            return;
        }
        callback(data, response);
    }

    function pingComplete(callback, postdata, data, response) {
        if (callback === undefined) {
            return;
        }
        callback(data);
    }

    function registerComplete(callback, postdata, data, response) {
        if (callback === undefined) {
            return;
        }
        callback(data);
    }

    function listComplete(callback, postdata, data, response) {
        if (callback === undefined) {
            return;
        }

        if (data.status === 'success' && data.response && data.response.length > 0) {
            var index = 0;
            data.response.forEach(function(item) {
                item.position = index + 1;
                index += 1;
            });
        }

        callback(data);
    }

    function getLeaderboardComplete(callback, postdata, data, response) {
        if (callback === undefined) {
            return;
        }

        if (data.status === 'success' && data.response && data.response.length > 0) {
            var index = 0;
            data.response.forEach(function(item) {
                item.position = index + 1;
                index += 1;
            });
        }

        callback(data);
    }

    /**
     * @function init
     * @desc Lorem ipsum
     * @memberof! module:Gamezyme
     * @param {function} callback - The callback function of your game.
     * @example
     * var callback = function(response) {
     *     console.log(JSON.stringify(response))
     * };
     *
     * Gamezyme.init(callback);
     */
    gz.init = function(publicKey, callback, error) {
        var arrayLoginButton = document.getElementsByTagName("gs:fb-login-button"),
            params_api = publicKey.split("_"),
            loginButton,
            onloginFunction,
            iframe,
            span;

        if (params_api.indexOf('undefined') !== -1) {
            throw ERRORS[2];
        }

        PUBLICKEY = params_api[0];
        GAMEID = params_api[1];
        VERSION = "1.0";
        APIURL += "api/v1?publickey=" + PUBLICKEY;
        IDENTIFIERAPI = publicKey;

        if (callback !== undefined) {
            getStateAuth(callback);
        }

        if (error !== undefined) {
            errorCallback = error;
        }

        if (arrayLoginButton && arrayLoginButton[0]) {
            loginButton = arrayLoginButton[0];
            onloginFunction = loginButton.getAttribute("onlogin");
            iframe = document.createElement('iframe');
            span = document.createElement('span');

            if (!onloginFunction) {
                throw ('Not found "onlogin" function in button login facebook');
            }

            iframe.setAttribute("width", "1000px");
            iframe.setAttribute("height", "1000px");
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allowtransparency", "true");
            iframe.setAttribute("allowfullscreen", "true");
            iframe.setAttribute("scrolling", "no");
            iframe.setAttribute("allowfullscreen", "true");
            iframe.setAttribute("style", "border: none; visibility: visible; width: 65px; height: 22px;");
            iframe.setAttribute("src", APIURL + "/facebook/getButtonLogin");

            span.setAttribute("style", "vertical-align: bottom; width: 65px; height: 22px;");
            span.appendChild(iframe);

            loginButton.appendChild(span);
        }
    };

    /**
     * @namespace module:Gamezyme.player
     */
    gz.player = {

        /**
         * @function localSignUp
         * @desc With this function you can register players.
         * @memberof! module:Gamezyme.player
         * @param {string} email - Player's email.
         * @param {string} password - Player's password.
         * @param {string} name - Player's name.
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         *
         * @example
         * var email = 'foo@bar.io';
         * var password = 'foobar';
         * var name = 'Scott C. Alves';
         *
         * Gamezyme.player.localSignUp(email, password, name, function(result) {
         *     var error = result.error;
         *     if (error) {
         *         // Probably the player exists
         *         console.log(error.message);
         *     } else {
         *         // Player signed up successfully
         *         console.log(result.response);
         *     }
         * });
         */
        localSignUp: function(email, password, name, callback) {
            var arrayError = [],
                params = {
                    email: email,
                    password: password,
                    name: name
                };
            validateParameter('email', email, arrayError);
            validateParameter('password', password, arrayError);
            validateParameter('name', name, arrayError);
            validateArrayError(arrayError);
            AuthenticationFactory.unregisterCredential();
            sendAPIRequest("players", "localSignUp", localSignUpComplete, callback, params);
        },

        /**
         * @function localLogin
         * @desc If a player has an account, use this function to login into GameSage.
         * @memberof! module:Gamezyme.player
         * @param {string} email - Player's email.
         * @param {string} password - Player's password.
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * var email = 'foo@bar.io';
         * var password = 'foobar';
         *
         * Gamezyme.player.localLogin(email, password, function(result) {
         *     var error = result.error;
         *     if (error) {
         *         // Maybe there's an error with his email or password
         *         console.log(error.message);
         *     } else {
         *         // Player logged in successfully
         *         console.log(result.response);
         *     }
         * });
         */
        localLogin: function(email, password, callback) {
            var arrayError = [],
                params = {
                    email: email,
                    password: password
                };
            validateParameter('email', email, arrayError);
            validateParameter('password', password, arrayError);
            validateArrayError(arrayError);
            AuthenticationFactory.unregisterCredential(); //delete session in browser
            sendAPIRequest("players", "localLogin", localLoginComplete, callback, params);
        },

        /**
         * @function openPopupLoginFacebook
         * @desc Open popup for Facebook login
         * @memberof! module:Gamezyme.player
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * var btnLoginFacebook = document.getElementsById("fb-login");
         *
         * button.onclick = function(e) {
         *     Gamezyme.player.openPopupLoginFacebook(function(result) {
         *     var error = result.error;
         *     if (error) {
         *         console.log(error.message);
         *     } else {
         *         console.log(result.response);
         *     }
         * }
         */
        openPopupLoginFacebook: function(callback) {
            if (loginWindowClosed) {
                var popupWidth = 600,
                    popupHeight = 400,
                    xPosition = (window.innerWidth - popupWidth) / 2,
                    yPosition = (window.innerHeight - popupHeight) / 2,
                    loginUrl = APIURL + "/player/auth/facebook/" + GAMEID;


                gamesageLoginWindow = window.open(loginUrl, "LoginWindow",
                    "location=1,scrollbars=1," +
                    "width=" + popupWidth + ",height=" + popupHeight + "," +
                    "left=" + xPosition + ",top=" + yPosition);

                if (gamesageLoginWindow) {
                    loginWindowClosed = false;
                }

                gamesageLoginWindowsFinish = false;
                loginCallback = callback;
                loginWindowTimer = setInterval(onTimerCallbackToCheckLoginWindowClosure, 1000);
            }
        },

        /**
         * @function isLoggedIn
         * @desc Check if the player is already logged in
         * @memberof! module:Gamezyme.player
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * Gamezyme.player.isLoggedIn(function(result){
         *    if(result.response === true) {
         *        // This means the player ir already logged in
         *        console.log('Player already logged in');
         *    }
         * });
         */
        isLoggedIn: function(callback) {
            var result = {
                status: 'success',
                response: AuthenticationFactory.isLogged
            };

            if (callback === undefined) {
                return result;
            }
            callback(result);
        },

        /**
         * @function saveData
         * @desc Save the player data of your game.
         * @memberof! module:Gamezyme.player
         * @param {Object} params - All the params that you want to save, like the score of the player. You can send an object with 1 or more key-value pair.
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * var data = {
         *     currentLevel: 5,
         *     money: 3200,
         *     score: 5000,
         * };
         *
         * Gamezyme.player.saveData(data, function(result){
         *    if(result.status === 'success' && result.response === true) {
         *        // Data saved successfully
         *        console.log('Data saved');
         *    }
         * });
         */
        saveData: function(params, callback) {
            sendAPIRequest("players", "saveData", getOrSaveDataComplete, callback, {
                playerDataJSON: params
            });
        },

        /**
         * @function getData
         * @desc Gets the player data of your game.
         * @memberof! module:Gamezyme.player
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * var playerData = {};
         *
         * Gamezyme.player.getData(function(result){
         *    if(result.status === 'success') {
         *        // Successfully retrieved data
         *        console.log('Data retrieved');
         *        playerData = result.response;
         *    }
         * });
         */
        getData: function(callback) {
            sendAPIRequest("players", "getData", getOrSaveDataComplete, callback);
        },

        /**
         * @function logout
         * @desc Logout player
         * @memberof! module:Gamezyme.player
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * Gamezyme.player.logout(function(result){
         *    if(result.status === 'success') {
         *        // Player logged out
         *        console.log('Player logged out');
         *    }
         * });
         */
        logout: function(callback) {
            sendAPIRequest("players", "logout", logoutComplete, callback);
        },

        /**
         * @function forgotPassword
         * @desc Send an email to the player to recover password
         * @memberof! module:Gamezyme.player
         * @param {string} mail - Email of the player.
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * var email = "foo@bar.io";
         *
         * Gamezyme.player.forgotPassword(email, function(result){
         *    if(result.status === 'success') {
         *        // An email It was sent to the player to recover his/her password
         *        console.log('Player logged out');
         *    }
         * });
         */
        forgotPassword: function(email, callback) {
            var params = {
                email: email
            };

            sendAPIRequest("players", "forgotPassword", forgotPasswordComplete, callback, params);
        },

        /**
         * @function me
         * @desc Retrieve information about the current player
         * @memberof! module:Gamezyme.player
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * var player = {};
         *
         * Gamezyme.player.me(function(result){
         *    if(result.status === 'success') {
         *        // Successfully player info retrieved
         *        console.log('Player info retrieved');
         *        player = result.response
         *
         *        // Player's email
         *        console.log(player.email);
         *        // Player's identifier
         *        console.log(player.identifier);
         *        // Player's name
         *        console.log(player.name);
         *        // Player's typeIdentifier (local sign-up or facebook)
         *        console.log(player.typeIdentifier);
         *        // Player's profile picture (if typeIdentifier is Facebook,
         *        // will the player's profile image of his Facebook account)
         *        console.log(player.urlProfilePicture);
         *    }
         * });
         */
        me: function(callback) {
            sendAPIRequest("players", "me", meComplete, callback);
        }


    };

    /**
     * @namespace module:Gamezyme.game
     */
    gz.game = {
        /**
         * @function getAllVars
         * @desc Retrieve all game vars
         * @memberof! module:Gamezyme.game
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * var gameVars = {};
         *
         * Gamezyme.game.getAllVars(function(response){
         *     gameVars = response.result;
         * });
         */
        getAllVars: function(callback) {
            sendAPIRequest("properties", "getGamevars", loadComplete, callback);
        },

        /**
         * @function getVar
         * @desc Retrieve a single game var
         * @memberof! module:Gamezyme.game
         * @param {String} key - Key of the game var that you want to retrieve from the server.s
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * var key = "boss01_health";
         * var value;
         *
         * Gamezyme.game.getAllVars(key, function(response){
         *     if (typeof response.error == 'undefined') {
         *         value = response.result;
         *     }
         * });
         */
        getVar: function(key, callback) {
            sendAPIRequest("properties", "getGamevar", loadComplete, callback, {
                key: key
            });
        }
    };


    /**
     * @namespace module:Gamezyme.server
     */
    gz.server = {
        /**
         * @function ping
         * @desc Send player's info to the server, like time, player's ID, among others.
         * @memberof! module:Gamezyme.server
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * Gamezyme.server.ping(function(result){
         *     if (typeof result.error == 'undefined') {
         *         // everything's fine
         *     }
         * });
         */
        ping: function(callback) {
            sendAPIRequest("healths", "ping", pingComplete, callback, {
                type: 'html5'
            });
        }
    };

    /**
     * @namespace module:Gamezyme.purchases
     */
    gz.purchases = {
        /**
         * @function register
         * @desc Register an In-App Purchase (IAP)
         * @memberof! module:Gamezyme.purchases
         * @param {Object} params -
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * Gamezyme.server.ping(function(result){
         *     if (typeof result.error == 'undefined') {
         *         // everything's fine
         *     }
         * });
         */
        register: function(params, callback) {
            sendAPIRequest("purchases", "register", registerComplete, callback, params);
        }
    };

    /**
     * @namespace module:Gamezyme.leaderboard
     */
    gz.leaderboard = {
        /**
         * @function getGlobal
         * @desc Register an In-App Purchase (IAP)
         * @memberof! module:Gamezyme.leaderboard
         * @param {Object} params - ---
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * Gamezyme.server.ping(function(result){
         *     if (typeof result.error == 'undefined') {
         *         // everything's fine
         *     }
         * });
         */
        getGlobal: function(options, callback) {
            sendAPIRequest("leaderboards", "allScores", getLeaderboardComplete, callback, {
                options: options
            });
        },

        /**
         * @function getFriends
         * @desc Register an In-App Purchase (IAP)
         * @memberof! module:Gamezyme.leaderboard
         * @param {Object} optons - ---
         * @param {module:Gamezyme~callback} callback - This function send the response from the server.
         * @example
         * Gamezyme.server.ping(function(result){
         *     if (typeof result.error == 'undefined') {
         *         // everything's fine
         *     }
         * });
         */
        getFriends: function(options, callback) {
            sendAPIRequest("leaderboards", "friendsScores", getLeaderboardComplete, callback, {
                options: options
            });
        }
    };

    return gz;
}());

// if (window.GamezymeAsyncInit && !window.GamezymeAsyncInit.hasRun) {
//     window.GamezymeAsyncInit.hasRun = true;
//     window.GamezymeAsyncInit();
// }
//
// if (!window.GamezymeAsyncInit) {
//     throw 'gz.init must have defined var window.GamezymeAsyncInit';
// }

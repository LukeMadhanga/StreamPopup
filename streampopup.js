(function ($, count) {
    
    "use strict";
    
    var ef = function () {return;},
    methods = {
        init: function (opts) {
            var T = this;
            if (T.length > 1) {
                // If the length is more than one, apply this function to all objects
                T.each(function() {
                    $(this).streamPopup(opts);
                });
                return T;
            } else if (!T.length || T.data('streampopupdata')) {
                // There are no objects or
                // This object has already been instantiated
                return T;
            }
            var data = {
                instanceid: ++count,
                s: $.extend({
                    onBeforeHide: ef,
                    onBeforeShow: ef,
                    onHide: ef,
                    onInit: ef,
                    onLoadFail: ef,
                    onLoadSuccess: ef,
                    onShow: ef
                }, opts)
            },
            inner = '<div class="streampopup-inner"><div class="streampopup-contents"></div></div><div class="streampopup-buttons"></div>';
            T.addClass('streampopup-container').data({'streampopupinstanceid': data.instanceid}).append(inner);
            T.data('streampopupdata', data);
            data.s.onInit.call(T[0], {data: data});
            return T;
        },
        /**
         * Show the popup
         * @param {mixed} html The html to put in the main section of the popup: A string (assumed html) or an object with a property
         *  'url', i.e. A url from which to get data
         * @param {object} buttons [optional] An object in the form {'button label': onClickFunction, ...} of all of the buttons to create.
         *  Defaults to just a close button
         * @returns {jQuery}
         */
        show: function (html, buttons) {
            return this.each(function () {
                var t = $(this),
                data = t.data('streampopupdata'),
                defbtns = {Close: function () {
                    t.streamPopup('hide');
                }},
                inner = $('.streampopup-contents', t),
                btns = buttons ? $.extend(defbtns, buttons) : defbtns,
                btncontainer = $('.streampopup-buttons', t),
                btnid,
                innerhtml = html;
                if (!data) {
                    throw new ex('InstanceError', 'Plugin has not been instantiated on this element');
                }
                if (data.s.onBeforeShow.call(this) === false) {
                    // The user cancelled the call
                    return t;
                }
                inner.children().remove();
                if (Object.prototype.toString.call(html) !== '[object String]') {
                    // The caller wants to load external data
                    innerhtml = '<div class="streampopup-loading"></div>';
                    $.ajax({
                        url: html.url,
                        type: 'GET',
                        dataType: 'JSON'
                    }).done(function (e) {
                        if (e.result === 'OK') {
                            inner.html(e.data);
                        }
                        data.s.onLoadSuccess.call(t[0], e);
                    }).fail(function (e) {
                        inner.html('Failed to load data');
                        data.s.onLoadFail.call(t[0], e);
                    });
                }
                inner.html(innerhtml);
                btncontainer.html('');
                for (var x in btns) {
                    // Create the buttons and assign the event
                    btnid = x.toLowerCase().replace(/[^a-z0-9]/g, '');
                    btncontainer.append('<a class="streampopup-button" id="streampopup-button-' + btnid + '">' + x + '</a>');
                    if (Object.prototype.toString.call(btns[x]) === '[object Function]') {
                        // Setup an onclick callback
                        $('#streampopup-button-' + btnid).unbind('click.streampopupbtn').on('click.streampopupbtn', btns[x]);
                    } else {
                        // Assume a url
                        $('#streampopup-button-' + btnid).attr({href: btns[x]});
                    }
                }
                t.show();
                data.s.onShow.call(this);
                return t;
            });
        },
        /**
         * Hide the popup
         * @returns {jQuery}
         */
        hide: function () {
            return this.each(function () {
                var t = $(this),
                data = t.data('streampopupdata');
                if (!data) {
                    throw new ex('InstanceError', 'Plugin has not been instantiated on this element');
                }
                if (data.s.onBeforeHide.call(this) === false) {
                    // The user cancelled the call
                    return t;
                }
                $('.streampopup-inner', t).children().remove();
                $('.streampopup-buttons', t).children().remove();
                t.hide();
                data.s.onHide.call(this);
                return t;
            });
        }
    };
    
    /**
     * Exception Object
     * @param {string} exceptiontype The name of the exception to replace xxx in the string "Uncaught StreamPopup::xxx - message"
     * @param {string} message The exception message
     * @returns {StreamPopup::Exception}
     */
    function ex(exceptiontype, message) {
        return {
            name: 'StreamPopup::' + exceptiontype,
            level: "Cannot continue",
            message: message,
            htmlMessage: message,
            toString: function() {
                return ['Error: StreamPopup::', exceptiontype, ' - ', message].join('');
            }
        };
    }
    
    $.fn.streamPopup = function(methodOrOpts) {
        if (methods[methodOrOpts]) {
            // The first option passed is a method, therefore call this method
            return methods[methodOrOpts].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (Object.prototype.toString.call(methodOrOpts) === '[object Object]' || !methodOrOpts) {
            // The default action is to call the init function
            return methods.init.apply(this, arguments);
        } else {
            // The user has passed us something dodgy, throw an error
            $.error(['The method ', methodOrOpts, ' does not exist'].join(''));
        }
    };
    
}(jQuery, 0));
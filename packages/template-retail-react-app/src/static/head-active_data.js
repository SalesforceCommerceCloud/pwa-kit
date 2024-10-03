var dw = (window.dw || {});
dw.ac = {
    _analytics: null,
    _events: [],
    _category: "",
    _searchData: "",
    _anact: "",
    _anact_nohit_tag: "",
    _analytics_enabled: "true",
    _timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    _capture: function(configs) {
        if (Object.prototype.toString.call(configs) === "[object Array]") {
            configs.forEach(captureObject);
            return;
        }
        dw.ac._events.push(configs);
    },
    capture: function() {
        dw.ac._capture(arguments);
        // send to CQ as well:
        if (window.CQuotient) {
            window.CQuotient.trackEventsFromAC(arguments);
        }
    },
    EV_PRD_SEARCHHIT: "searchhit",
    EV_PRD_DETAIL: "detail",
    EV_PRD_RECOMMENDATION: "recommendation",
    EV_PRD_SETPRODUCT: "setproduct",
    applyContext: function(context) {
        if (typeof context === "object" && context.hasOwnProperty("category")) {
            dw.ac._category = context.category;
        }
        if (typeof context === "object" && context.hasOwnProperty("searchData")) {
            dw.ac._searchData = context.searchData;
        }
    },
    setDWAnalytics: function(analytics) {
        dw.ac._analytics = analytics;
    },
    eventsIsEmpty: function() {
        return 0 == dw.ac._events.length;
    }
};
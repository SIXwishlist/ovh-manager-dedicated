/**
 * Api.<get|put|post|delete>('url', options);
 *
 * where options can be:
 *   urlParams: {} -> variables who are in the URI (names must be identics), like '/toto/{totoId}' : { totoId: myTotoId }
 *   data : {}     -> variables send in the body of the request
 *   params : {}   -> extras GET variables, like 'url?toto=titi&tata=1'
 */
angular.module("services").service("Api", [
    "$http",
    "$q",
    function ($http, $q) {
        "use strict";

        const self = this;

        this.operation = function (opt) {
            const requestUrl = URI.expand(opt.url, opt.urlParams || {})
                .search(opt.params || {})
                .toString();
            let requestBody;

            // Add body to the request (POST & PUT)
            if (opt.data) {
                requestBody = angular.toJson(opt.data);
            }

            return $http({
                method: opt.method,
                url: requestUrl,
                data: requestBody,
                cache: opt.cache || false,
                timeout: opt.timeout
            }).then((response) => response.data, (response) => $q.reject(response));
        };

        angular.forEach(["get", "put", "post", "delete"], (operationType) => {
            self[operationType] = function (url, opt) {
                const options = angular.extend({}, opt);
                options.method = angular.uppercase(operationType);
                options.url = url;
                return self.operation(options);
            };
        });
    }
]);

angular.module("App").controller("CacherulesAddCtrl", ($scope, $stateParams, cdnDedicatedOrderRule, Alerter) => {
    $scope.alert = "cdn_domain_tab_rules_alert";
    $scope.prices = null;
    $scope.choices = {
        count: null,
        duration: null,
        order: null
    };
    $scope.contractsValidated = {};

    $scope.loadCacherulesPrice = function () {
        if (!$scope.prices) {
            cdnDedicatedOrderRule.getCacherulePrices($stateParams.productId).then((prices) => {
                $scope.prices = prices.results;
            });
        }
    };

    $scope.loadCacherulesOrders = function () {
        $scope.orders = null;
        cdnDedicatedOrderRule.getCacheruleOrders($stateParams.productId, $scope.choices.count).then(
            (orders) => {
                let i = 0;
                for (i; i < orders.results.length; i++) {
                    orders.results[i].duration.formattedDuration = parseInt(orders.results[i].duration.duration, 10);
                }
                $scope.orders = orders.results;
            },
            (data) => {
                $scope.resetAction();
                Alerter.alertFromSWS($scope.tr("cdn_configuration_cacherules_upgrade_fail"), data, $scope.alert);
            }
        );
    };

    $scope.updateOrder = function () {
        const choosenOrder = $.grep($scope.orders, (e) => e.duration.duration === $scope.choices.duration);
        if (choosenOrder.length > 0) {
            $scope.choices.order = choosenOrder[0];
        }
    };

    $scope.orderCacherules = function () {
        $scope.url = null;
        cdnDedicatedOrderRule.orderCacherules($stateParams.productId, $scope.choices.count, $scope.choices.order.duration.duration).then(
            (order) => {
                $scope.url = order.url;
            },
            (data) => {
                $scope.resetAction();
                Alerter.alertFromSWS($scope.tr("cdn_configuration_cacherules_upgrade_fail"), data, $scope.alert);
            }
        );
    };

    $scope.displayBC = function () {
        $scope.resetAction();
        window.open($scope.url, "_blank");
    };
});

angular.module("App").controller("DedicatedCloudDatacentersOrderDatastoresCtrl", ($scope, $stateParams, DedicatedCloud, translator) => {

    $scope.orderDatastores = {
        datacenter: null,
        model: null,
        selected: null,
        selectedModel: null,
        quantityToOrder: 1,
        orderResult: null,
        agreeContract: null,
        loading: false
    };
    $scope.dedicatedCloud = null;

    $scope.loadDatastoresProfiles = function () {
        $scope.orderDatastores.loading = true;
        $scope.orderDatastores.datacenter = $scope.currentActionData;

        DedicatedCloud.getSelected($stateParams.productId, false).then(
            (dedicatedCloud) => {
                $scope.dedicatedCloud = dedicatedCloud;
                DedicatedCloud.getOrderableDatastoresProfiles($stateParams.productId, $scope.dedicatedCloud.location, $scope.orderDatastores.datacenter.id).then(
                    (data) => {
                        $scope.orderDatastores.model = data;
                        $scope.orderDatastores.loading = false;
                    },
                    (data) => {
                        $scope.resetAction();
                        $scope.orderDatastores.loading = false;
                        $scope.setMessage(translator.tr("dedicatedCloud_configuration_order_datastores_finish_fail", [$scope.orderDatastores.datacenter.name]), angular.extend(data, { type: "ERROR" }));
                    }
                );
            },
            (data) => {
                $scope.orderDatastores.loading = false;
                $scope.setMessage($scope.tr("dedicatedCloud_configuration_order_hosts_finish_fail"), angular.extend(data, { type: "ERROR" }));
            }
        );
    };

    $scope.$watch("orderDatastores.quantityToOrder", () => {
        if ($scope.orderDatastores.quantityToOrder && !isNaN($scope.orderDatastores.quantityToOrder)) {
            if ($scope.orderDatastores.quantityToOrder < 1) {
                $scope.orderDatastores.quantityToOrder = 1;
            } else if ($scope.orderDatastores.quantityToOrder > 20) {
                $scope.orderDatastores.quantityToOrder = 20;
            }
        } else {
            $scope.orderDatastores.quantityToOrder = 1;
        }
    });

    $scope.getDatastoreSelected = function () {
        $scope.orderDatastores.loading = true;
        $scope.orderDatastores.selectedModel = $scope.orderDatastores.model[$scope.orderDatastores.selected];

        DedicatedCloud.getMonthlyDatastoreOrder($stateParams.productId, $scope.orderDatastores.datacenter.id, $scope.orderDatastores.selectedModel.name, $scope.orderDatastores.quantityToOrder).then(
            (data) => {
                $scope.orderDatastores.orderResult = data;
                $scope.orderDatastores.loading = false;
            },
            (data) => {
                $scope.orderDatastores.loading = false;
                $scope.resetAction();
                $scope.setMessage(translator.tr("dedicatedCloud_configuration_order_datastores_finish_fail", [$scope.orderDatastores.datacenter.name]), angular.extend(data, { type: "ERROR" }));
            }
        );
    };

    $scope.displayBC = function () {
        $scope.orderDatastores.loading = true;
        DedicatedCloud.orderDatastores($stateParams.productId, $scope.orderDatastores.datacenter.id, $scope.orderDatastores.selectedModel.name, $scope.orderDatastores.quantityToOrder)
            .then((data) => {
                window.open(data.url, "_blank");
                $scope.setMessage(translator.tr("dedicatedCloud_configuration_order_datastores_finish_success", [data.url, data.orderId]), true);
            })
            .catch((err) => $scope.setMessage(translator.tr("dedicatedCloud_configuration_order_datastores_finish_fail", [$scope.orderDatastores.datacenter.name]), angular.extend(err, { type: "ERROR" })))
            .finally(() => {
                $scope.orderDatastores.loading = false;
                $scope.resetAction();
            });
    };
});

// --------------ADD ACCESS------------------

angular.module("App").controller("HousingAddAccessFtpBackupCtrl", ($rootScope, $scope, Housing, $stateParams, Alerter) => {
    "use strict";

    const alert = "housing_tab_ftpbackup_alert";
    const ips = _.map($scope.currentActionData, (ip) => ip.ipBlock);

    $scope.access = {
        listIp: [],
        ip: null,
        ftp: false,
        cifs: false,
        nfs: false
    };
    $scope.loading = false;

    $scope.load = function () {
        $scope.loading = true;
        Housing.getAuthorizableBlocks($stateParams.productId).then(
            (list) => {
                $scope.access.listIp = _.difference(list, ips);

                $scope.loading = false;
            },
            (data) => {
                $scope.resetAction();
                Alerter.alertFromSWS($scope.tr("housing_configuration_ftpbackup_access_add_ip_failure"), data, alert);
            }
        );
    };

    $scope.addFtpBackup = function () {
        const resultMessages = {
            OK: $scope.tr("housing_configuration_ftpbackup_access_add_success"),
            PARTIAL: $scope.tr("housing_configuration_ftpbackup_access_add_partial"),
            ERROR: $scope.tr("housing_configuration_ftpbackup_access_add_failure")
        };

        $scope.loading = true;

        Housing.postFtpBackupIp($stateParams.productId, $scope.access.ip, $scope.access.ftp, $scope.access.nfs, $scope.access.cifs)
            .then(
                (data) => {
                    angular.forEach(data, (task) => {
                        task.id = task.taskId;
                        $rootScope.$broadcast("housing.ftpbackup.task.refresh", task);
                    });
                    $rootScope.$broadcast("housing.ftpBackup.access.load");
                    Alerter.success(resultMessages.OK, alert);
                },
                (data) => {
                    Alerter.alertFromSWSBatchResult(resultMessages.ERROR, data, alert);
                }
            )
            .finally(() => {
                $scope.resetAction();
            });
    };
});

angular.module("App").controller("DeleteFtpBackupCtrl", ($scope, $stateParams, Server, Alerter) => {
    const alert = "server_tab_ftpbackup_alert";
    $scope.ftpBackup = $scope.currentActionData;
    $scope.loading = false;

    $scope.deleteFtpBackup = function () {
        $scope.loading = true;

        Server.deleteFtpBackup($stateParams.productId)
            .then(
                () => {
                    Alerter.success($scope.tr("server_configuration_ftpbackup_delete_success"), alert);
                },
                (data) => {
                    Alerter.alertFromSWS($scope.tr("server_configuration_ftpbackup_delete_failure"), data.data, alert);
                }
            )
            .finally(() => {
                $scope.resetAction();
                $scope.loading = false;
            });
    };
});

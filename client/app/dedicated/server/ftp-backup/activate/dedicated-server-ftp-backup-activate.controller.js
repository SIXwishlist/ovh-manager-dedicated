angular.module("App").controller("ActivateFtpBackupCtrl", ($scope, $stateParams, Server, Alerter) => {
    const alert = "server_tab_ftpbackup_alert";

    $scope.loading = false;

    $scope.activateFtpBackup = function () {
        $scope.loading = true;

        Server.activateFtpBackup($stateParams.productId)
            .then(
                () => {
                    Alerter.success($scope.tr("server_configuration_ftpbackup_activate_success"), alert);
                },
                (data) => {
                    Alerter.alertFromSWS($scope.tr("server_configuration_ftpbackup_activate_failure"), data.data, alert);
                }
            )
            .finally(() => {
                $scope.resetAction();
                $scope.loading = false;
            });
    };
});

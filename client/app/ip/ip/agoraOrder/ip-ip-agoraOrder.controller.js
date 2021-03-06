angular.module("Module.ip.controllers").controller("agoraIpOrderCtrl", ["$scope", "$rootScope", "$window", "$q", "$log", "IpAgoraOrder", "IpOrganisation", "User", "Alerter", "translator",
    function ($scope, $rootScope, $window, $q, $log, AgoraOrder, Organisation, User, Alerter, translator) {
        "use strict";

        this.model = {
            params: {},
            selectedService: null
        };
        this.loading = {};

        this.loadServices = () => {
            this.loading.services = true;
            return AgoraOrder.getServices().then((data) => {
                this.services = data;
            }).catch((err) => {
                Alerter.error(translator.tr("ip_order_loading_error"));
                $scope.resetAction();
                return $q.reject(err);
            }).finally(() => {
                this.loading.services = false;
            });
        };

        // need to be scoped because of how wizard-step works
        $scope.loadServices = this.loadServices.bind(this);

        this.getServiceTypeLabel = (type) => translator.tr(`ip_filter_services_title_${type}`);

        this.loadIpOffers = () => {
            this.loading.ipOffers = true;

            this.model.params = {};

            const ipOffersPromise = AgoraOrder.getIpOffers()
                .then((ipOffers) => {
                    this.ipOffers = ipOffers.map(createOfferDto);
                });

            const ipOrganisationPromise = Organisation.getIpOrganisation()
                .then((organisations) => {
                    this.organisations = organisations;
                });

            return $q.all([ipOffersPromise, ipOrganisationPromise])
                .catch((err) => {
                    Alerter.error(translator.tr("ip_order_loading_error"));
                    $scope.resetAction();
                    return $q.reject(err);
                })
                .finally(() => {
                    this.loading.ipOffers = false;
                });
        };

        // need to be scoped because of how wizard-step works
        $scope.loadIpOffers = this.loadIpOffers.bind(this);

        function createOfferDto (ipOffer) {
            const maximumQuantity = ipOffer.details.pricings.default.find((price) => price.capacities[0] === "renew").maximumQuantity;
            const countryCodes = ipOffer.details.product.configurations.find((config) => config.name === "country").values;
            return {
                productName: ipOffer.invoiceName,
                productShortName: ipOffer.invoiceName.replace(/^.*\]\s*/, ""),
                productRegion: _.get(ipOffer.invoiceName.match(/^\[([^\]]+)\]/), "1"),
                planCode: ipOffer.planCode,
                price: ipOffer.details.pricings.default.find((price) => price.capacities[0] === "installation").price,
                maximumQuantity,
                quantities: _.range(1, maximumQuantity + 1),
                countries: countryCodes.map((countryCode) => ({
                    code: countryCode,
                    description: translator.tr(`country_${countryCode.toUpperCase()}`)
                })),

                // Only ip block offer has a maximum quantity of 1. This is a way to distinguish an ip block offer from a single ip address offer.
                isIpBlockOffer: maximumQuantity === 1
            };
        }

        this.getIpOfferRegions = () => _.uniq(_.pluck(this.ipOffers, "productRegion")).sort();

        this.onSelectedOfferChange = () => {
            this.model.params.selectedQuantity = null;
            this.model.params.selectedOrganisation = null;
            this.model.params.selectedCountry = null;

            if (_.get(this.model, "params.selectedOffer.countries.length") === 1) {
                this.model.params.selectedCountry = _.first(_.get(this.model, "params.selectedOffer.countries"));
            }
        };

        this.isOfferFormValid = () => {

            if (!this.model.params.selectedOffer || !this.model.params.selectedCountry) {
                return false;
            }

            if (!this.model.params.selectedOffer.isIpBlockOffer && !this.model.params.selectedQuantity) {
                return false;
            }

            return true;
        };

        this.redirectToOrganisationPage = () => {
            $rootScope.$broadcast("ips.display", "organisation");
            $scope.resetAction();
        };

        this.redirectToPaymentPage = () => {
            const productToOrder = createProductToOrder(this.model);

            return User.getUrlOf("express_order")
                .then((url) => {
                    $window.open(`${url}review?products=${JSURL.stringify([productToOrder])}`, "_blank");
                })
                .catch((err) => {
                    Alerter.error(translator.tr("ip_order_finish_error"));
                    $scope.resetAction();
                    return $q.reject(err);
                })
                .finally(() => $scope.resetAction());
        };

        // need to be scoped because of how wizard-step works
        $scope.redirectToPaymentPage = this.redirectToPaymentPage.bind(this);

        $scope.stringLocaleSensitiveComparator = function (v1, v2) {
            return v1.value.localeCompare(v2.value);
        };

        function createProductToOrder (model) {
            const productToOrder = {
                planCode: model.params.selectedOffer.planCode,
                productId: "ip",
                duration: "P1M",
                pricingMode: "default",
                quantity: model.params.selectedQuantity || 1,
                configuration: []
            };

            if (model.selectedService) {
                productToOrder.configuration.push({
                    label: "destination",
                    value: model.selectedService.serviceName
                });
            }

            if (model.params.selectedCountry) {
                productToOrder.configuration.push({
                    label: "country",
                    value: model.params.selectedCountry.code
                });
            }

            if (model.params.selectedOrganisation) {
                productToOrder.configuration.push({
                    label: "organisation",
                    value: model.params.selectedOrganisation.organisationId
                });
            }
            return productToOrder;
        }
    }]);

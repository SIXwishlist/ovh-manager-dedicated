angular.module("Billing.filters").filter("autorenewFrequenceText", [
    "translator",
    function (translator) {
        "use strict";

        const BASE_I18N_SLUG = "autorenew_service_renew_";

        return function (period) {
            let slug;
            switch (period) {
            case 1:
                slug = `${BASE_I18N_SLUG}month`;
                break;
            case 3:
                slug = `${BASE_I18N_SLUG}3months`;
                break;
            case 6:
                slug = `${BASE_I18N_SLUG}6months`;
                break;
            case 12:
                slug = `${BASE_I18N_SLUG}year`;
                break;
            default:
                return translator.tr(`${BASE_I18N_SLUG}frequency_value`, [period]);
            }
            return translator.tr(slug);
        };
    }
]);

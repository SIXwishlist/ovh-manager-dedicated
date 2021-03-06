angular.module("ovhSignupApp").component("newAccountFormField", {
    require: {
        newAccountForm: "^newAccountForm"
    },
    bindings: {
        rule: "<", // api rule
        fieldset: "<" // parent form fieldset
    },
    template: '<div data-ng-include="getTemplateUrl()"></div>',
    controller: [
        "$scope",
        "$filter",
        "translator",
        "$q",
        "$timeout",
        "NewAccountFormConfig",
        "UserAccount.conf.BASE_URL",

        function ($scope, $filter, translator, $q, $timeout, NewAccountFormConfig, BASE_URL) {
            "use strict";

            $scope.getTemplateUrl = () => `${BASE_URL}components/newAccountForm/field/new-account-form-field-component.html`;

            // because i'm cheap and lazy
            const $translate = {
                instant: translator.tr
            };
            this.tr = $translate.instant;

            this.$onInit = function () {
                // unique field identifier
                this.id = `ovh_field_${this.rule.fieldName}`;

                // field value
                this.value = undefined;

                // set default value
                this.setDefaultValue();

                // initialize value if rule has initialValue attribute
                this.setInitialValue();

                // set default debounce value
                this.debounce = NewAccountFormConfig.debounce;

                // cache for enum translations
                this.translatedEnumCache = null;

                // validate input on rule update
                $scope.$watch("$ctrl.rule", () => {
                    this.translatedEnumCache = null;
                    if (this.fieldset[this.id]) {
                        this.fieldset[this.id].$validate();
                    }
                });

                // handle email validation
                if (this.rule.fieldName === "email") {
                    $scope.$on("account.email.response.validity", (ev, isValid) => {
                        if (this.value) {
                            this.fieldset[this.id].$setValidity("emailAvailable", isValid);
                        }
                    });
                }

                // handle special phone prefix case
                if (this.getFieldType() === "phone") {
                    $scope.$watch(
                        "$ctrl.newAccountForm.rules",
                        (rules) => {
                            const rule = _.find(rules, { fieldName: "phoneCountry" });
                            this.phoneCountryList = _.map(_.get(rule, "in"), (country) => ({
                                country,
                                prefix: NewAccountFormConfig.phonePrefix[country],
                                label: $translate.instant(`signup_enum_country_${country}`)
                            }));
                            this.phoneCountryList = $filter("orderBy")(this.phoneCountryList, "label", false, (a, b) => String(a.value).localeCompare(String(b.value)));

                            const current = _.find(this.phoneCountryList, { country: _.get(this.newAccountForm.model, "phoneCountry") });
                            const orig = _.find(this.phoneCountryList, { country: _.get(this.newAccountForm.originalModel, "phoneCountry") });
                            const country = _.find(this.phoneCountryList, { country: _.get(this.newAccountForm.model, "country") });
                            const subCountry = _.find(this.phoneCountryList, { country: _.get(this.newAccountForm.model, "ovhSubsidiary") });

                            this.phoneCountry = current || orig || country || subCountry || _.first(this.phoneCountryList);

                            if (current !== _.get(this.phoneCountry, "country")) {
                                $timeout(() => {
                                    if (this.newAccountForm.onFieldChange) {
                                        this.newAccountForm.onFieldChange(
                                            {
                                                fieldName: "phoneCountry"
                                            },
                                            _.get(this.phoneCountry, "country")
                                        );
                                    }
                                });
                            }
                        },
                        true
                    );
                }
            };

            // if rule has a default value, use it
            this.setDefaultValue = () => {
                if (this.rule.defaultValue && !this.rule.initialValue) {
                    if (this.getFieldType() === "select") {
                        this.value = {
                            key: this.rule.defaultValue,
                            translated: this.rule.fieldName === "timezone" ? this.rule.defaultValue : $translate.instant(`signup_enum_${this.rule.defaultValue}`)
                        };
                        if (this.newAccountForm.onFieldChange) {
                            this.newAccountForm.onFieldChange(this.rule, this.value.key, this.fieldset);
                        }
                    } else {
                        this.value = this.rule.defaultValue;
                        if (this.newAccountForm.onFieldChange) {
                            this.newAccountForm.onFieldChange(this.rule, this.value, this.fieldset);
                        }
                    }
                }
            };

            // if rule has an initialValue, use it
            this.setInitialValue = () => {
                if (this.rule.initialValue) {
                    let value = angular.copy(this.rule.initialValue);
                    if (this.getFieldType() === "select") {
                        value = {
                            key: value,
                            translated: this.rule.fieldName === "timezone" ? value : $translate.instant(`signup_enum_${value}`)
                        };
                    } else if (this.getFieldType() === "date") {
                        value = moment(this.rule.initialValue, "YYYY-MM-DD").toDate();
                    } else if (this.rule.prefix && _.startsWith(value, this.rule.prefix)) {
                        value = value.slice(this.rule.prefix.length);
                    }
                    this.value = value;
                }
            };

            // returns field type depending of current rule
            this.getFieldType = () => {
                if (this.rule.fieldType) {
                    return this.rule.fieldType;
                } else if (this.rule.in) {
                    return "select";

                    // return this.rule.in.length > 30 ? "typeahead" : "select";
                } else if (/email/.test((this.rule.fieldName || "").toLowerCase())) {
                    return "email";
                } else if ((this.rule.fieldName || "").toLowerCase() === "birthday") {
                    return "date";
                } else if (this.rule.fieldName === "phone" && _.find(this.newAccountForm.rules, { fieldName: "phoneCountry" })) {
                    return "phone";
                }
                return "text";
            };

            // returns translated list of rule enum values
            this.getTranslatedEnums = () => {
                if (this.translatedEnumCache) {
                    return this.translatedEnumCache;
                }

                let result = _.map(this.rule.in || [], (value) => {
                    let translated;
                    if (this.rule.fieldName === "area" && this.newAccountForm.model.country) {
                        translated = $translate.instant(`signup_enum_${this.newAccountForm.model.country}_${this.rule.fieldName}_${value}`);
                    } else if (this.rule.fieldName === "timezone") {
                        translated = value;
                    } else {
                        translated = $translate.instant(`signup_enum_${this.rule.fieldName}_${value}`);
                    }
                    return {
                        key: value,
                        translated
                    };
                });

                result = $filter("orderBy")(result, "translated", false, (a, b) => String(a.value).localeCompare(String(b.value)));

                // if there is only a single value, auto select it
                if (result.length === 1 && this.value !== _.first(result).key && !this.autoSelectPending) {
                    this.autoSelectPending = true;
                    this.value = _.first(result);
                    $timeout(() => {
                        this.onChange();
                        this.autoSelectPending = false;
                    });
                }

                this.translatedEnumCache = result;
                return result;
            };

            // handle special area translation cases
            this.getTranslatedArea = () => {
                if (this.newAccountForm.model.country === "US" || this.newAccountForm.model.country === "WE") {
                    return $translate.instant("signup_field_state");
                }
                return $translate.instant("signup_field_area");
            };

            // true if current modified field is valid, false otherwise
            this.isValid = () => {
                const field = this.fieldset[this.id];
                return this.value && field && field.$valid;
            };

            // true if current field is dirty and invalid
            this.isInvalid = () => {
                const field = this.fieldset[this.id];
                return field && field.$invalid;
            };

            // returns a normalized identifier (skip spaces)
            this.cleanIdentifier = (_id) => {
                let id = _id;
                if (id) {
                    id = id.replace(/\s/g, "");
                }
                return id;
            };

            // returns a normalized phone number
            this.cleanPhoneNumber = (_number) => {
                let number = _number;
                if (number) {
                    number = number.replace(/\s/g, "");
                    number = number.replace(/(?:\-)(\d)/g, "$1"); // remove "-" char preceding a digit
                    number = number.replace(/(?:\()(\d+)(?:\))/g, "$1"); // remove parenthesis around digits
                }
                return number;
            };

            // true if field is a generic identifier
            this.isGenericIdentifierField = () => ["vat", "nationalIdentificationNumber", "companyNationalIdentificationNumber"].indexOf(this.rule.fieldName) >= 0;

            // true if field is a phone number
            this.isPhoneNumberField = () => ["phone", "fax"].indexOf(this.rule.fieldName) >= 0;

            // validates input taking care of rule prefix and regularExpression
            this.inputValidator = {
                test: (_value) => {
                    let value = _value;

                    // normalize input to make it easier for the user
                    // to type numbers (ignore spaces etc)
                    if (this.isPhoneNumberField()) {
                        value = this.cleanPhoneNumber(value);
                    } else if (this.isGenericIdentifierField()) {
                        value = this.cleanIdentifier(value);
                    }

                    if (this.rule.regularExpression) {
                        if (this.rule.prefix && value) {
                            value = this.rule.prefix + value;
                        }
                        const regex = this.rule.regularExpression.replace(/\//g, "\\/");
                        return new RegExp(regex).test(value);
                    } else if (this.rule.fieldName === "password") {
                        return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(value);
                    } else if (this.rule.in) {
                        if (this.rule.mandatory) {
                            return value && _.indexOf(this.rule.in, value.key) >= 0;
                        } else if (value) {
                            return _.indexOf(this.rule.in, value.key) >= 0;
                        }
                    }

                    return true;
                }
            };

            // callback for when model changed
            this.onChange = () => {
                let value = this.value;
                const fieldType = this.getFieldType();

                // normalize input to make it easier for the user
                // to type numbers (ignore spaces etc)
                if (this.isPhoneNumberField()) {
                    value = this.cleanPhoneNumber(value);
                } else if (this.isGenericIdentifierField()) {
                    value = this.cleanIdentifier(value);
                }

                if (fieldType === "select" || fieldType === "typeahead") {
                    value = value ? value.key : value;
                } else if (fieldType === "date") {
                    // avoids datepicker setting value to null
                    if (!value) {
                        this.newAccountForm.onFieldChange(this.rule, undefined, this.fieldset);
                        return;
                    }
                    value = moment(value).format("YYYY-MM-DD");
                } else if (this.rule.prefix && value) {
                    // only add prefix if value is defined
                    value = this.rule.prefix + value;
                }

                // notify field changes
                if (this.newAccountForm.onFieldChange) {
                    this.newAccountForm.onFieldChange(this.rule, value, this.fieldset);
                }

                // if email or ovhCompany changes, we need to check for email availability
                if (this.rule.fieldName === "email" || this.rule.fieldName === "ovhCompany") {
                    $scope.$emit("account.email.request.validity");
                }
            };

            this.onPhonePrefixChange = () => {
                this.phonePrefixChanged = true;
                if (this.newAccountForm.onFieldChange) {
                    this.newAccountForm.onFieldChange(
                        {
                            fieldName: "phoneCountry"
                        },
                        _.get(this.phoneCountry, "country")
                    );
                }
            };
        }
    ]
});

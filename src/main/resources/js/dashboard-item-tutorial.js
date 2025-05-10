define('dashboard-items/tutorial', ['underscore', 'jquery', 'wrm/context-path'], function (_, $, contextPath) {
    var DashboardItem = function (API) {
        this.API = API;
        this.issues = [];
    };
    const DEBUG = true;//setup environment mode
    const VALUE_TYPE = 1;
    const FUNC_TYPE = 2;
    const EMPTY_STR = '';
    var cachedFormData = [];//storing data from form
    let userInputIDS = ['uq_1', 'uq_2', 'uq_3'];//base inputs with query for creating api request
    const USER_INPUT_EXAMPLE_ID = '#user_input_example';//if of user input example stub
    const INPUT_ID_BASE_LABEL = 'uq_';//base part of user input
    let elIdSequence = 4;//id of new element; starts from last existed base user inputs

    /**
     * Input Handler - wrap and return array with inputs data/attributes/values/api response
     * @param type - specified type of wrapper we hope to get
     * @param chartData - data of inputs
     * @returns array - wrapped data
     */
    function inputHandler(type, chartData) {
        let arrayWrapper = [];
        if (VALUE_TYPE == type) {//return values from api response
            return userInputIDS.map(function (inputID) {
                return chartData[inputID];
            });
        } else if (FUNC_TYPE == type) {//
            return userInputIDS.map(function (inputID) {
                return fetchByQuery(inputID);
            });
        }
    }

    /**
     * Fetch By Query - create ajax request based on provided value
     * @param inputID - string with input id
     * @returns Promise<Response>
     */
    function fetchByQuery(inputID) {
        let apiRequest = EMPTY_STR;//for api request
        if (DEBUG) {
            apiRequest = 'http://vasiliy.ho.ua/api/index.php?chart=1&' + inputID + '=1';
        } else {
            if (cachedFormData[inputID]) {
                apiRequest =
                    'https://k5120.pixsoftware.de/jira/rest/api/2/search/?jql=' + cachedFormData[inputID] + ' ORDER BY created DESC';
            } else {
                console.log('___err of inputValue: ' + inputID + "; " + cachedFormData[inputID]);
            }
        }
        console.log('___apiRequest for ' + inputID + ': ' + apiRequest);
        
        if (!apiRequest) return;

        return fetch(apiRequest).then(function(response) {
            return response.json().then(function(data) {
                //write id of input and api response
                return {
                    // url: response.url,
                    data: data,
                    id: inputID, 
                };
            });
        });
    }

    /**
     * Load Chart By Data - create chart based on provided data
     * @param chartData - array with row data
     * @returns void
     */
    function loadChartByData(chartData) {
        console.log("___pref in loadChart localFormData:", cachedFormData);
        // Load Chart.js first
        let chartContainer = document.getElementById('chart');//block to contain chart visualization
        if (!chartContainer) return;

        new Chart(chartContainer, {
            type: 'bar',
            data: {
                // labels: [ chartData['uq_1'], chartData['uq_2'], chartData['uq_3'] ],
                labels: inputHandler(VALUE_TYPE, chartData),//set array with queries response (array[..., ..., ...])
                datasets: [{
                    label: '# data from queries',//chart title
                    data: inputHandler(VALUE_TYPE, chartData),//set array with queries response (array[..., ..., ...])
                    backgroundColor: ['blue', 'yellow', 'green'],//row colors
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Called to render the view for a fully configured dashboard item.
     *
     * @param context The surrounding <div/> context that this items should render into.
     * @param preferences The user preferences saved for this dashboard item (e.g. filter id, number of results...)
     */
    DashboardItem.prototype.render = function (context, preferences) {
        this.API.showLoadingBar();
        var $element = this.$element = $(context).find("#dynamic-content");
        var self = this;
        this.requestData(preferences).done(function (data) {
            self.API.hideLoadingBar();
            self.issues = data.issues;
            if (self.issues === undefined || self.issues.length  === 0) {
                $element.empty().html(Dashboard.Item.Tutorial.Templates.Empty());
                //get data by user queries
                Promise.all(inputHandler(FUNC_TYPE))
                    .then(function(results) {
                        let data = [];
                        results.forEach(function(result) {//write api response to array['inputID' => response]
                            data[result.id] = result.data.total;
                        });
                        loadChartByData(data);//create chart
                    })
                    .catch(function(error) {
                        console.error('___One of the requests failed:', error);
                    });
                    //get data from data-my
                    let md = $('#dynamic-content').data('my');
                    console.log('___data-my___ : ' + md);
                    //
            }
            else {
                $element.empty().html(Dashboard.Item.Tutorial.Templates.IssueList({issues: self.issues}));
            }
            self.API.resize();
            $element.find(".submit").click(function (event) {
                event.preventDefault();
                self.render(context, preferences);
            });
        });

        this.API.once("afterRender", this.API.resize);
    };

    DashboardItem.prototype.requestData = function (preferences) {
        return $.ajax({
            method: "GET",
            url: contextPath() + "/rest/api/2/search?maxResults=10&jql=due<=" + preferences['due-date-input']
        });
    };



    DashboardItem.prototype.renderEdit = function (context, preferences) {
        userInputIDS = ['uq_1', 'uq_2', 'uq_3'];//set user inputs id's to base state
        var $element = this.$element = $(context).find("#dynamic-content");
        $element.empty().html(Dashboard.Item.Tutorial.Templates.Configuration());
        this.API.once("afterRender", this.API.resize);
        var $form = $("form", $element);
        $(".cancel", $form).click(_.bind(function() {
            if(preferences['due-date-input'])
                this.API.closeEdit();
        }, this));

        $form.submit(_.bind(function(event) {
            event.preventDefault();

            var preferences = getPreferencesFromForm($form);
            cachedFormData = preferences;//storing data from form localy
            var regexp = /^\d+([dwm])$/;
            if(regexp.test(preferences['due-date-input'])) {
                this.API.savePreferences(preferences);
                this.API.showLoadingBar();
            }
        }, this));
        
        const USER_INPUT_EXAMPLE_STUB = $element.find(USER_INPUT_EXAMPLE_ID);//user input example stub element
        //handling "add user" button (add new user input for getting new chart row)
        $element.find('#add_input').click(function () {
            let userInputExampleCopy = USER_INPUT_EXAMPLE_STUB.clone();//create copy of empty user input container
            userInputExampleCopy.attr('id', USER_INPUT_EXAMPLE_ID + '_' + elIdSequence);//change id of user input container
            userInputExampleCopy.removeClass('dis').addClass('vis');//set new user input container to visible state
            let userInputExampleCopyId = INPUT_ID_BASE_LABEL + elIdSequence;//create id for user input
            let label = userInputExampleCopy.find('label');//search label el in container
            label.attr('for', userInputExampleCopyId);//change "for" attribute for label
            label.text( (label.text()) + elIdSequence );//change text
            let input = userInputExampleCopy.find('input');//search input el in container
            input.attr('id', userInputExampleCopyId);//change id
            input.attr('name', userInputExampleCopyId);//change name
            $element.find('#user_input_container')//add new elements to user input form container
                .append(label)//add new label
                .append(input)//add new el input
                .append(userInputExampleCopy.find('.description'));//add new ".description" div
            elIdSequence++;//increase id sequence for new el
            userInputIDS.push(userInputExampleCopyId);//add new el id to user inputs id's array (to manage it during api request)
        });
    };

    function getPreferencesFromForm($form) {
        var preferencesArray = $form.serializeArray();
        var preferencesObject = {};

        preferencesArray.forEach(function(element) {
            preferencesObject[element.name] = element.value;
        });

        return preferencesObject;
    }


    return DashboardItem;
});
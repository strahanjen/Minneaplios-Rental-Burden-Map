    require([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/FeatureLayer",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",
      "esri/widgets/Slider"
    ],
    function(
      Map,
      MapView,
      FeatureLayer,
      GraphicsLayer,
      Graphic,
      Slider
    ) {
      let highlight;
      var map = new Map({
        basemap: "gray"
      });

      var view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-93.25,44.98],
        zoom: 15
      });

      var highlightOwnerAction = {
        title: "Highlight Owner",
        id: "highlight-owner",
        image: "highlight.png"
      };

      // Event handler that fires each time an action is clicked.
      view.popup.on("trigger-action", function(event) {
        // Execute the selectFeatures() function if the highlight-owner action is clicked
        if (event.action.id === "highlight-owner") {
        selectFeatures();
        }
      });

      // Add parcels feature layer to map
      var featureLayer = new FeatureLayer({
        url: "https://services5.arcgis.com/Zh7NGcamADZ4F6Hp/arcgis/rest/services/Minneapolis_Non_homesteaded_Parcels/FeatureServer/0",
        outFields: ["*"],  // Return all fields to client
        popupTemplate: {  // Enable a popup on client
          title: "{OWNER_NAME}", // Show field value
          content: "The owner name is {OWNER_NAME}.",  // Show field value
          actions: [highlightOwnerAction]
        }
      });

      map.add(featureLayer);

      //Create a slider for selection of rental burden ranges
      const slider = new Slider({
        container: "sliderDiv",
        min: 5,
        max: 55,
        steps: 1,
        values: [ 25 ],
        snapOnClickEnabled: false,
        visibleElements: {
          labels: true,
          rangeLabels: true
        }
      });

        // Get the rent burden value set by the user
        slider.on("thumb-drag", function (event) {
            var sqlExpression = "RENT_BURD >=" + event.value;
            setFeatureLayerViewFilter(sqlExpression);
        });

        view.ui.add(filterDiv, "top-right");

        // Client-side filter
        let setFeatureLayerViewFilter = (expression)=> {
          view.whenLayerView(featureLayer).then(function(featureLayerView) {
            featureLayerView.filter = {
              where: expression
            };
          });
        }

        let selectFeatures = () => {
              view.graphics.removeAll();
              // Get the 'owner_name' attribute from the selected feature
              var attributes = view.popup.selectedFeature.attributes;
              var owner_name = attributes.OWNER_NAME;

              // Create an sql expression to find all parcels with selected owner name
              var sql_expression="OWNER_NAME = '" +owner_name+"'";

              //make sure that the featureLayerView is available
              view.whenLayerView(featureLayer).then(function(featureLayerView) {
                if (featureLayerView) {
                  // create a query and set the sql_expression
                  var query = {
                    where: sql_expression,
                    outFields: ["*"]  //return all fields
                  };

                  // run the query
                  featureLayerView
                    .queryFeatures(query)
                    .then(results => {
                      const graphics = results.features;
                      if (graphics.length > 0) {
                          // remove existing highlighted features
                          if (highlight) {
                            highlight.remove();
                          }

                          // highlight query results
                          highlight = featureLayerView.highlight(graphics);
                      } else {
                        console.log("no graphics");
                      }

                    })
                    .catch(errorCallback);
                }
              });
      }

      let errorCallback = error => console.log("error:", error);

    });

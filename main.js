var chili = angular.module("chiliApp", ["firebase", "ngRoute"]);

chili.constant('firebaseUri', 'https://dazzling-inferno-5752.firebaseio.com');

chili.factory("simpleLogin", ["$firebaseSimpleLogin", 'firebaseUri', function($firebaseSimpleLogin, uri) {
  var ref = new Firebase(uri);
  return {
    firebase: $firebaseSimpleLogin(ref),
    username: ''
  };
}]);


chili.config(function($routeProvider, $locationProvider) {

  $routeProvider.when('/Chili/:chiliId', {
    templateUrl: 'detail.html',
    controller: 'DetailController'
  })
  .when('/Login', {
    templateUrl: 'login.html',
    controller: 'LoginController'
  })
  .otherwise({
    templateUrl: 'home.html',
    controller: 'HomeController'
  });

  //$locationProvider.html5Mode(true);
});

chili.controller('LoginController', ['$scope', '$location', 'simpleLogin', '$rootScope', function($scope, $location, simpleLogin, $root) {
  $root.auth = simpleLogin;

  $scope.username = simpleLogin.username;

  $scope.enter = function () {
    $location.path('/Home');
  }
}]);

chili.controller('HomeController', ['$scope', 'simpleLogin', function($scope, auth) {

  $scope.auth = auth;

}]);

chili.controller('DetailController', ['$scope', '$firebase', 'firebaseUri', function($scope, $firebase, firebaseUri) {
  var ref = new Firebase(firebaseUri + '/entries');
  var sync = $firebase(ref);

}]);

chili.controller("ChiliChat", ['$scope', '$firebase', 'firebaseUri', function($scope, $firebase, firebaseUri) {
  var ref = new Firebase(firebaseUri + '/chat');
  var sync = $firebase(ref);

  var syncObject = sync.$asObject();

  syncObject.$bindTo($scope, "data");
}]);

chili.controller("ChiliList", function($scope, $firebase) {

  var ref = new Firebase("https://dazzling-inferno-5752.firebaseio.com/entries");
  var sync = $firebase(ref);

  var syncObject = sync.$asArray();

  console.dir(syncObject);

  $scope.entries = syncObject;

});



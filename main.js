var chili = angular.module("chiliApp", ["firebase", "ngRoute", 'ngCookies']);

chili.constant('firebaseUri', 'https://dazzling-inferno-5752.firebaseio.com');

chili.factory("simpleLogin", ["$firebaseSimpleLogin", 'firebaseUri', '$cookies', function($firebaseSimpleLogin, uri, $cookies) {
  var ref = new Firebase(uri),
    instance = {
      firebase: $firebaseSimpleLogin(ref),
      username: $cookies.username,
      login: function (user) {
        $cookies.username = user;
        instance.username = user;
      }
    };
  return instance;
}]);


chili.config(function($routeProvider, $locationProvider) {

   var requireAuthentication = function () {
        return {
            load: ['$q', '$location', 'simpleLogin', function ($q, $location, auth) {
                if (auth.username) {
                    var deferred = $q.defer();
                    deferred.resolve();
                    return deferred.promise;
                } else {
                    $location.path('/Login');
                    return $q.reject("NO AUTH");
                }
            }]
        };
    };

  $routeProvider.when('/Chili/:chiliId', {
    templateUrl: 'detail.html',
    controller: 'DetailController',
    resolve: requireAuthentication()
  })
  .when('/Chat', {
    templateUrl: 'chat.html',
    controller: 'ChatController',
    resolve: requireAuthentication()
  })
  .when('/Login', {
    templateUrl: 'login.html',
    controller: 'LoginController'
  })
  .when('/Add', {
    templateUrl: 'add.html',
    controller: 'AddController'
  })
  .otherwise({
    templateUrl: 'home.html',
    controller: 'HomeController',
    resolve: requireAuthentication()
  });

});

chili.run(['simpleLogin', '$rootScope', function (simpleLogin, $root) {
  $root.auth = simpleLogin;
}]);

chili.controller('LoginController', ['$scope', '$location', 'simpleLogin', function($scope, $location, simpleLogin) {

  $scope.username = simpleLogin.username;

  $scope.enter = function () {
    if ($scope.username) {
      simpleLogin.login($scope.username);
      $location.path('/Home');
    }
  }
}]);

chili.controller('HomeController', ['$scope', '$firebase', 'firebaseUri', function($scope, $firebase, firebaseUri) {

  var ref = new Firebase(firebaseUri + "/entries");
  var sync = $firebase(ref);

  var syncObject = sync.$asArray();

  $scope.entries = syncObject;

  $scope.formatRating = function (rating) {
    return (rating.presentation + rating.aroma + rating.texture + rating.taste + rating.aftertaste) + '/50';
  };

}]);

chili.controller('DetailController', ['$scope', '$routeParams', '$firebase', 'firebaseUri', function($scope, $routeParams, $firebase, firebaseUri) {
  var ref = new Firebase(firebaseUri + '/entries/' + $routeParams.chiliId);
  var sync = $firebase(ref);
  var detail = sync.$asObject();

  $scope.detail = detail;
  $scope.isRated = false;

  detail.$loaded(function () {
    if (detail.rating && detail.rating[$scope.auth.username]) {
        $scope.rating = detail.rating[$scope.auth.username];
        $scope.isRated = true;
    }
  });

  $scope.rate = function () {

    if (!detail.rating)
      detail.rating = {};

    detail.rating[$scope.auth.username] = $scope.rating;
    detail.$save();

    $scope.isRated = true;
  };

}]);

chili.controller("ChatController", ['$scope', '$firebase', 'firebaseUri', function($scope, $firebase, firebaseUri) {
  var ref = new Firebase(firebaseUri + '/chat');
  var sync = $firebase(ref.endAt().limit(500));

  $scope.messages = sync.$asArray();

  ref.on('child_added', function () {
    console.log('Ding');
  });

  $scope.postChat = function() {
    $scope.messages.$add({user: $scope.auth.username, text: $scope.chatInput});

    $scope.chatInput = '';
  };

}]);


chili.controller("AddController", ['$scope', '$firebase', 'firebaseUri', function($scope, $firebase, firebaseUri) {

  var ref = new Firebase(firebaseUri + "/entries");
  var sync = $firebase(ref);

  $scope.addChili = function () {

    sync.$push({
      title: $scope.title,
      description: $scope.description,
      owner: $scope.owner,
      photo: $scope.photo
    })

    $scope.title = '';
    $scope.description = '';
    $scope.owner = '';
    $scope.photo = '';
  };

}]);


// Workaround for angular not supporting range type inpurts
chili.directive('toNumber', function () {
    return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
          ctrl.$parsers.push(function (value) {
            return parseInt(value || '', 10);
          });
        }
    };
});
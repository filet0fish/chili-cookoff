var chili = angular.module("chiliApp", ["firebase", "ngRoute", 'ngCookies']);

chili.constant('firebaseUri', 'https://dazzling-inferno-5752.firebaseio.com');

chili.factory("simpleLogin", ["$firebaseSimpleLogin", 'firebaseUri', '$cookies', function($firebaseSimpleLogin, uri, $cookies) {
  var ref = new Firebase(uri),
    instance = {
      firebase: $firebaseSimpleLogin(ref),
      username: $cookies.username,
      admin: 'chili-admin',

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
  .when('/Results', {
    templateUrl: 'results.html',
    controller: 'ResultsController'
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
    if (rating) {
      return ((rating.presentation + rating.aroma + rating.texture + (rating.taste*2) + rating.aftertaste) / 60)*100;
    } else {
      return 0;
    }
  };

}]);

chili.controller('DetailController', ['$scope', '$routeParams', '$location', '$firebase', 'firebaseUri', function($scope, $routeParams, $location, $firebase, firebaseUri) {
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

    $location.path('/Home');
  };

}]);

chili.controller("ChatController", ['$scope', '$firebase', 'firebaseUri', function($scope, $firebase, firebaseUri) {
  var ref = new Firebase(firebaseUri + '/chat');
  var sync = $firebase(ref.endAt().limit(500));

  $scope.messages = sync.$asArray();

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


chili.controller('ResultsController', ['$scope', '$firebase', 'firebaseUri', function($scope, $firebase, firebaseUri) {

  var ref = new Firebase(firebaseUri + "/entries");
  var sync = $firebase(ref);

  var list = sync.$asArray();

  var sum = function (result, value, key) {
        return result + ((value) ? value : 0);
      },
      avg = function (item) {
        var totals = {
          presentation: _.chain(item.rating).pluck('presentation').reduce(sum, 0).value(),
          aroma: _.chain(item.rating).pluck('aroma').reduce(sum, 0).value(),
          taste: _.chain(item.rating).pluck('taste').reduce(sum, 0).value(),
          texture: _.chain(item.rating).pluck('texture').reduce(sum, 0).value(),
          aftertaste: _.chain(item.rating).pluck('aftertaste').reduce(sum, 0).value()
        },
        max = {
          presentation: _.pluck(item.rating, 'presentation').length * 10,
          aroma: _.pluck(item.rating, 'aroma').length * 10,
          taste: _.pluck(item.rating, 'taste').length * 10,
          texture: _.pluck(item.rating, 'texture').length * 10,
          aftertaste: _.pluck(item.rating, 'aftertaste').length * 10
        },
        avg = [
          (totals['presentation']/max['presentation']),
          (totals['aroma']/max['aroma']),
          (totals['taste']/max['taste']) * 2,
          (totals['texture']/max['texture']),
          (totals['aftertaste']/max['aftertaste'])
        ],
        pct = _.reduce(avg, function (r,v) { return (v) ? r+v: r; }, 0)/6;
      return Math.round(pct*1000)/10;
    },
    avgSort = function(a, b) {
      var aa = avg(a),
          ab = avg(b);

        return (aa===ab) ? 0 : ((aa<ab) ? 1 : -1);
    };

  $scope.avgRating = avg



  $scope.ttlRating = function (item) {
    var totals = {
          presentation: _.chain(item.rating).pluck('presentation').reduce(sum, 0).value(),
          aroma: _.chain(item.rating).pluck('aroma').reduce(sum, 0).value(),
          taste: _.chain(item.rating).pluck('taste').reduce(sum, 0).value() * 2,
          texture: _.chain(item.rating).pluck('texture').reduce(sum, 0).value(),
          aftertaste: _.chain(item.rating).pluck('aftertaste').reduce(sum, 0).value()
        },
        max = {
          presentation: _.pluck(item.rating, 'presentation').length * 10,
          aroma: _.pluck(item.rating, 'aroma').length * 10,
          taste: _.pluck(item.rating, 'taste').length * 20,
          texture: _.pluck(item.rating, 'texture').length * 10,
          aftertaste: _.pluck(item.rating, 'aftertaste').length * 10
        };

    return _.reduce(totals, function (r,v) { return (v) ? r+v: r; }, 0)
            + ' of '
            + _.reduce(max, function (r,v) { return (v) ? r+v: r; }, 0);
  };


  list.$watch(function (e){
    list.sort(avgSort);
    $scope.entries = _.first(list, 4);
  });

  //$scope.entries = list;
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
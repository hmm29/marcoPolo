/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <AppHub/AppHub.h>
#import "AppDelegate.h"
#import "RCTRootView.h"

#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [AppHub setApplicationID:@"EZ1vdoRGFMd7fbl7fPPt"];

  NSURL *jsCodeLocation;

  /**
   * Loading JavaScript code - uncomment the one you want.
   *
   * OPTION 1
   * Load from development server. Start the server from the repository root:
   *
   * $ npm start
   *
   * To run on device, change `localhost` to the IP address of your computer
   * (you can get this by typing `ifconfig` into the terminal and selecting the
   * `inet` value under `en0:`) and make sure your computer and iOS device are
   * on the same Wi-Fi network.
   */

  // jsCodeLocation = [NSURL URLWithString:@"http://localhost:8081/index.ios.bundle\?platform=ios&dev\=0"];

  /**
   * OPTION 2
   * Load from pre-bundled file on disk. To re-generate the static bundle
   * from the root of your project directory, run
   *
   * $ react-native bundle --minify
   *
   * see http://facebook.github.io/react-native/docs/runningondevice.html
   */

    //   jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];

    /**
     * OPTION 3 - AppHub
     *
     * Load cached code and images from AppHub.
     *
     * Make sure to re-generate the static bundle from the
     * root of your directory by running
     *
     * $ react-native bundle --minify
     */

     AHBuild *build = [[AppHub buildManager] currentBuild];
     jsCodeLocation = [build.bundle URLForResource:@"main"
                                    withExtension:@"jsbundle"];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"VentureApp"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [[UIViewController alloc] init];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  // return YES;
  return [[FBSDKApplicationDelegate sharedInstance] application:application
                                      didFinishLaunchingWithOptions:launchOptions];
}

 // Facebook SDK
 - (void)applicationDidBecomeActive:(UIApplication *)application {
   [FBSDKAppEvents activateApp];
 }

 - (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {
   return [[FBSDKApplicationDelegate sharedInstance] application:application
                                                         openURL:url
                                               sourceApplication:sourceApplication
                                                      annotation:annotation];
 }

#if __IPHONE_OS_VERSION_MAX_ALLOWED < 90000
- (NSUInteger)supportedInterfaceOrientations
#else
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
#endif
{
  return UIInterfaceOrientationMaskPortrait;
}

@end
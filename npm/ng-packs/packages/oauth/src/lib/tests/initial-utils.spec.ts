import { Component, Injector } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { OAuthService } from 'angular-oauth2-oidc';

import {
  CORE_OPTIONS,
  EnvironmentService,
  AuthService,
  ConfigStateService,
  AbpApplicationConfigurationService,
  SessionStateService,
  ApplicationConfigurationDto,
} from '@abp/ng.core';
import * as clearOAuthStorageDefault from '../utils/clear-o-auth-storage';
import { of } from 'rxjs';
import { checkAccessToken } from '../utils/check-access-token';

const environment = { oAuthConfig: { issuer: 'test' } };

@Component({
  selector: 'abp-dummy',
  template: '',
})
export class DummyComponent {}

describe('InitialUtils', () => {
  let spectator: Spectator<DummyComponent>;
  const createComponent = createComponentFactory({
    component: DummyComponent,
    mocks: [
      EnvironmentService,
      ConfigStateService,
      AbpApplicationConfigurationService,
      AuthService,
      OAuthService,
      SessionStateService,
    ],
    providers: [
      {
        provide: CORE_OPTIONS,
        useValue: {
          environment,
          registerLocaleFn: () => Promise.resolve(),
          skipGetAppConfiguration: false,
        },
      },
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  describe('#getInitialData', () => {
    let mockInjector;
    let configStateService;
    let authService;
    beforeEach(() => {
      mockInjector = {
        get: spectator.inject,
      };
      configStateService = spectator.inject(ConfigStateService);
      authService = spectator.inject(AuthService);
    });

    test('should called configStateService.refreshAppState', async () => {
      const configRefreshAppStateSpy = jest.spyOn(configStateService, 'refreshAppState');
      const appConfigRes = {
        currentTenant: { id: 'test', name: 'testing' },
      } as ApplicationConfigurationDto;

      configRefreshAppStateSpy.mockReturnValue(of(appConfigRes));

      // Todo: refactor it
      // await initFactory(mockInjector)();

      expect(configRefreshAppStateSpy).toHaveBeenCalled();
    });
  });

  describe('#checkAccessToken', () => {
    let injector;
    let injectorSpy;
    let clearOAuthStorageSpy;
    beforeEach(() => {
      injector = spectator.inject(Injector);
      injectorSpy = jest.spyOn(injector, 'get');
      clearOAuthStorageSpy = jest.spyOn(clearOAuthStorageDefault, 'clearOAuthStorage');
      clearOAuthStorageSpy.mockReset();
    });

    test('should call logOut fn of OAuthService when token is valid and current user not found', async () => {
      injectorSpy.mockReturnValueOnce({ getDeep: () => false });
      injectorSpy.mockReturnValueOnce({ hasValidAccessToken: () => true });
      checkAccessToken(injector);
      expect(clearOAuthStorageSpy).toHaveBeenCalled();
    });

    test('should not call logOut fn of OAuthService when token is invalid', async () => {
      injectorSpy.mockReturnValueOnce({ getDeep: () => true });
      injectorSpy.mockReturnValueOnce({ hasValidAccessToken: () => false });
      checkAccessToken(injector);
      expect(clearOAuthStorageSpy).not.toHaveBeenCalled();
    });

    test('should not call logOut fn of OAuthService when token is valid but user is not found', async () => {
      injectorSpy.mockReturnValueOnce({ getDeep: () => true });
      injectorSpy.mockReturnValueOnce({ hasValidAccessToken: () => true });
      checkAccessToken(injector);
      expect(clearOAuthStorageSpy).not.toHaveBeenCalled();
    });
  });
});

package com.kawaii.doodle.presentation.ui.auth;

import com.kawaii.doodle.domain.repository.AuthRepository;
import com.kawaii.doodle.domain.repository.ProfileRepository;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class AuthViewModel_Factory implements Factory<AuthViewModel> {
  private final Provider<AuthRepository> authRepoProvider;

  private final Provider<ProfileRepository> profileRepoProvider;

  public AuthViewModel_Factory(Provider<AuthRepository> authRepoProvider,
      Provider<ProfileRepository> profileRepoProvider) {
    this.authRepoProvider = authRepoProvider;
    this.profileRepoProvider = profileRepoProvider;
  }

  @Override
  public AuthViewModel get() {
    return newInstance(authRepoProvider.get(), profileRepoProvider.get());
  }

  public static AuthViewModel_Factory create(javax.inject.Provider<AuthRepository> authRepoProvider,
      javax.inject.Provider<ProfileRepository> profileRepoProvider) {
    return new AuthViewModel_Factory(Providers.asDaggerProvider(authRepoProvider), Providers.asDaggerProvider(profileRepoProvider));
  }

  public static AuthViewModel_Factory create(Provider<AuthRepository> authRepoProvider,
      Provider<ProfileRepository> profileRepoProvider) {
    return new AuthViewModel_Factory(authRepoProvider, profileRepoProvider);
  }

  public static AuthViewModel newInstance(AuthRepository authRepo, ProfileRepository profileRepo) {
    return new AuthViewModel(authRepo, profileRepo);
  }
}

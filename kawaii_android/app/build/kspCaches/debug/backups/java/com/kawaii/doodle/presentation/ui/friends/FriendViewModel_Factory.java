package com.kawaii.doodle.presentation.ui.friends;

import com.kawaii.doodle.domain.repository.AuthRepository;
import com.kawaii.doodle.domain.repository.FriendRepository;
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
public final class FriendViewModel_Factory implements Factory<FriendViewModel> {
  private final Provider<AuthRepository> authRepoProvider;

  private final Provider<FriendRepository> friendRepoProvider;

  private final Provider<ProfileRepository> profileRepoProvider;

  public FriendViewModel_Factory(Provider<AuthRepository> authRepoProvider,
      Provider<FriendRepository> friendRepoProvider,
      Provider<ProfileRepository> profileRepoProvider) {
    this.authRepoProvider = authRepoProvider;
    this.friendRepoProvider = friendRepoProvider;
    this.profileRepoProvider = profileRepoProvider;
  }

  @Override
  public FriendViewModel get() {
    return newInstance(authRepoProvider.get(), friendRepoProvider.get(), profileRepoProvider.get());
  }

  public static FriendViewModel_Factory create(
      javax.inject.Provider<AuthRepository> authRepoProvider,
      javax.inject.Provider<FriendRepository> friendRepoProvider,
      javax.inject.Provider<ProfileRepository> profileRepoProvider) {
    return new FriendViewModel_Factory(Providers.asDaggerProvider(authRepoProvider), Providers.asDaggerProvider(friendRepoProvider), Providers.asDaggerProvider(profileRepoProvider));
  }

  public static FriendViewModel_Factory create(Provider<AuthRepository> authRepoProvider,
      Provider<FriendRepository> friendRepoProvider,
      Provider<ProfileRepository> profileRepoProvider) {
    return new FriendViewModel_Factory(authRepoProvider, friendRepoProvider, profileRepoProvider);
  }

  public static FriendViewModel newInstance(AuthRepository authRepo, FriendRepository friendRepo,
      ProfileRepository profileRepo) {
    return new FriendViewModel(authRepo, friendRepo, profileRepo);
  }
}

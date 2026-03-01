package com.kawaii.doodle.data.repository;

import com.kawaii.doodle.data.local.dao.FriendDao;
import com.kawaii.doodle.data.local.dao.ProfileDao;
import com.kawaii.doodle.data.remote.SupabaseApiService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
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
public final class FriendRepositoryImpl_Factory implements Factory<FriendRepositoryImpl> {
  private final Provider<SupabaseApiService> apiProvider;

  private final Provider<FriendDao> friendDaoProvider;

  private final Provider<ProfileDao> profileDaoProvider;

  public FriendRepositoryImpl_Factory(Provider<SupabaseApiService> apiProvider,
      Provider<FriendDao> friendDaoProvider, Provider<ProfileDao> profileDaoProvider) {
    this.apiProvider = apiProvider;
    this.friendDaoProvider = friendDaoProvider;
    this.profileDaoProvider = profileDaoProvider;
  }

  @Override
  public FriendRepositoryImpl get() {
    return newInstance(apiProvider.get(), friendDaoProvider.get(), profileDaoProvider.get());
  }

  public static FriendRepositoryImpl_Factory create(
      javax.inject.Provider<SupabaseApiService> apiProvider,
      javax.inject.Provider<FriendDao> friendDaoProvider,
      javax.inject.Provider<ProfileDao> profileDaoProvider) {
    return new FriendRepositoryImpl_Factory(Providers.asDaggerProvider(apiProvider), Providers.asDaggerProvider(friendDaoProvider), Providers.asDaggerProvider(profileDaoProvider));
  }

  public static FriendRepositoryImpl_Factory create(Provider<SupabaseApiService> apiProvider,
      Provider<FriendDao> friendDaoProvider, Provider<ProfileDao> profileDaoProvider) {
    return new FriendRepositoryImpl_Factory(apiProvider, friendDaoProvider, profileDaoProvider);
  }

  public static FriendRepositoryImpl newInstance(SupabaseApiService api, FriendDao friendDao,
      ProfileDao profileDao) {
    return new FriendRepositoryImpl(api, friendDao, profileDao);
  }
}

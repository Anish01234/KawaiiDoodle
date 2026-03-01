package com.kawaii.doodle.data.repository;

import androidx.datastore.core.DataStore;
import androidx.datastore.preferences.core.Preferences;
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
public final class ProfileRepositoryImpl_Factory implements Factory<ProfileRepositoryImpl> {
  private final Provider<SupabaseApiService> apiProvider;

  private final Provider<ProfileDao> profileDaoProvider;

  private final Provider<DataStore<Preferences>> dataStoreProvider;

  public ProfileRepositoryImpl_Factory(Provider<SupabaseApiService> apiProvider,
      Provider<ProfileDao> profileDaoProvider, Provider<DataStore<Preferences>> dataStoreProvider) {
    this.apiProvider = apiProvider;
    this.profileDaoProvider = profileDaoProvider;
    this.dataStoreProvider = dataStoreProvider;
  }

  @Override
  public ProfileRepositoryImpl get() {
    return newInstance(apiProvider.get(), profileDaoProvider.get(), dataStoreProvider.get());
  }

  public static ProfileRepositoryImpl_Factory create(
      javax.inject.Provider<SupabaseApiService> apiProvider,
      javax.inject.Provider<ProfileDao> profileDaoProvider,
      javax.inject.Provider<DataStore<Preferences>> dataStoreProvider) {
    return new ProfileRepositoryImpl_Factory(Providers.asDaggerProvider(apiProvider), Providers.asDaggerProvider(profileDaoProvider), Providers.asDaggerProvider(dataStoreProvider));
  }

  public static ProfileRepositoryImpl_Factory create(Provider<SupabaseApiService> apiProvider,
      Provider<ProfileDao> profileDaoProvider, Provider<DataStore<Preferences>> dataStoreProvider) {
    return new ProfileRepositoryImpl_Factory(apiProvider, profileDaoProvider, dataStoreProvider);
  }

  public static ProfileRepositoryImpl newInstance(SupabaseApiService api, ProfileDao profileDao,
      DataStore<Preferences> dataStore) {
    return new ProfileRepositoryImpl(api, profileDao, dataStore);
  }
}

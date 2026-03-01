package com.kawaii.doodle.data.repository;

import com.kawaii.doodle.data.local.dao.DraftDao;
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
public final class DraftRepositoryImpl_Factory implements Factory<DraftRepositoryImpl> {
  private final Provider<SupabaseApiService> apiProvider;

  private final Provider<DraftDao> daoProvider;

  public DraftRepositoryImpl_Factory(Provider<SupabaseApiService> apiProvider,
      Provider<DraftDao> daoProvider) {
    this.apiProvider = apiProvider;
    this.daoProvider = daoProvider;
  }

  @Override
  public DraftRepositoryImpl get() {
    return newInstance(apiProvider.get(), daoProvider.get());
  }

  public static DraftRepositoryImpl_Factory create(
      javax.inject.Provider<SupabaseApiService> apiProvider,
      javax.inject.Provider<DraftDao> daoProvider) {
    return new DraftRepositoryImpl_Factory(Providers.asDaggerProvider(apiProvider), Providers.asDaggerProvider(daoProvider));
  }

  public static DraftRepositoryImpl_Factory create(Provider<SupabaseApiService> apiProvider,
      Provider<DraftDao> daoProvider) {
    return new DraftRepositoryImpl_Factory(apiProvider, daoProvider);
  }

  public static DraftRepositoryImpl newInstance(SupabaseApiService api, DraftDao dao) {
    return new DraftRepositoryImpl(api, dao);
  }
}

package com.kawaii.doodle.data.repository;

import com.kawaii.doodle.data.local.dao.DoodleDao;
import com.kawaii.doodle.data.remote.SupabaseApiService;
import com.kawaii.doodle.data.remote.SupabaseFunctionService;
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
public final class DoodleRepositoryImpl_Factory implements Factory<DoodleRepositoryImpl> {
  private final Provider<SupabaseApiService> apiProvider;

  private final Provider<SupabaseFunctionService> functionApiProvider;

  private final Provider<DoodleDao> daoProvider;

  public DoodleRepositoryImpl_Factory(Provider<SupabaseApiService> apiProvider,
      Provider<SupabaseFunctionService> functionApiProvider, Provider<DoodleDao> daoProvider) {
    this.apiProvider = apiProvider;
    this.functionApiProvider = functionApiProvider;
    this.daoProvider = daoProvider;
  }

  @Override
  public DoodleRepositoryImpl get() {
    return newInstance(apiProvider.get(), functionApiProvider.get(), daoProvider.get());
  }

  public static DoodleRepositoryImpl_Factory create(
      javax.inject.Provider<SupabaseApiService> apiProvider,
      javax.inject.Provider<SupabaseFunctionService> functionApiProvider,
      javax.inject.Provider<DoodleDao> daoProvider) {
    return new DoodleRepositoryImpl_Factory(Providers.asDaggerProvider(apiProvider), Providers.asDaggerProvider(functionApiProvider), Providers.asDaggerProvider(daoProvider));
  }

  public static DoodleRepositoryImpl_Factory create(Provider<SupabaseApiService> apiProvider,
      Provider<SupabaseFunctionService> functionApiProvider, Provider<DoodleDao> daoProvider) {
    return new DoodleRepositoryImpl_Factory(apiProvider, functionApiProvider, daoProvider);
  }

  public static DoodleRepositoryImpl newInstance(SupabaseApiService api,
      SupabaseFunctionService functionApi, DoodleDao dao) {
    return new DoodleRepositoryImpl(api, functionApi, dao);
  }
}

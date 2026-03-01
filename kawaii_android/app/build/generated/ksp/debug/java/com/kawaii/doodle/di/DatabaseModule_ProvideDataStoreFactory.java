package com.kawaii.doodle.di;

import android.content.Context;
import androidx.datastore.core.DataStore;
import androidx.datastore.preferences.core.Preferences;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.Providers;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
public final class DatabaseModule_ProvideDataStoreFactory implements Factory<DataStore<Preferences>> {
  private final Provider<Context> ctxProvider;

  public DatabaseModule_ProvideDataStoreFactory(Provider<Context> ctxProvider) {
    this.ctxProvider = ctxProvider;
  }

  @Override
  public DataStore<Preferences> get() {
    return provideDataStore(ctxProvider.get());
  }

  public static DatabaseModule_ProvideDataStoreFactory create(
      javax.inject.Provider<Context> ctxProvider) {
    return new DatabaseModule_ProvideDataStoreFactory(Providers.asDaggerProvider(ctxProvider));
  }

  public static DatabaseModule_ProvideDataStoreFactory create(Provider<Context> ctxProvider) {
    return new DatabaseModule_ProvideDataStoreFactory(ctxProvider);
  }

  public static DataStore<Preferences> provideDataStore(Context ctx) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.provideDataStore(ctx));
  }
}

package com.kawaii.doodle.worker;

import android.content.Context;
import androidx.work.WorkerParameters;
import dagger.internal.DaggerGenerated;
import dagger.internal.InstanceFactory;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

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
public final class DraftSyncWorker_AssistedFactory_Impl implements DraftSyncWorker_AssistedFactory {
  private final DraftSyncWorker_Factory delegateFactory;

  DraftSyncWorker_AssistedFactory_Impl(DraftSyncWorker_Factory delegateFactory) {
    this.delegateFactory = delegateFactory;
  }

  @Override
  public DraftSyncWorker create(Context p0, WorkerParameters p1) {
    return delegateFactory.get(p0, p1);
  }

  public static Provider<DraftSyncWorker_AssistedFactory> create(
      DraftSyncWorker_Factory delegateFactory) {
    return InstanceFactory.create(new DraftSyncWorker_AssistedFactory_Impl(delegateFactory));
  }

  public static dagger.internal.Provider<DraftSyncWorker_AssistedFactory> createFactoryProvider(
      DraftSyncWorker_Factory delegateFactory) {
    return InstanceFactory.create(new DraftSyncWorker_AssistedFactory_Impl(delegateFactory));
  }
}
